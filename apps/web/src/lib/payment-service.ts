import { connectDB, Order, User, Product, Coupon } from "@swago/database";
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from "./msg91-email";
import { invalidateProductCache } from "./productCache";
import { isValidObjectId } from "mongoose";
import { generateAndUploadInvoice } from "./invoice-service";
import { deductInventoryForOrder } from "./inventory-service";
import { hasActiveBomConfig } from "@swago/database";

interface FinalizeOrderOptions {
  orderIdOrMongoId: string;
  razorpayPaymentId: string;
  source: 'frontend' | 'webhook';
}

/**
 * Finalizes an order after a successful payment.
 * Handles order status, stock, coupons, swago money, and emails.
 * Safe to call multiple times (idempotent).
 */
export async function finalizeOrder({ orderIdOrMongoId, razorpayPaymentId, source }: FinalizeOrderOptions) {
  await connectDB();

  // 1. Find the order
  let order = await Order.findOne({ orderId: orderIdOrMongoId });
  if (!order && isValidObjectId(orderIdOrMongoId)) {
    order = await Order.findById(orderIdOrMongoId);
  }
  if (!order && orderIdOrMongoId.startsWith("order_")) {
    order = await Order.findOne({ razorpay_order_id: orderIdOrMongoId });
  }

  if (!order) {
    throw new Error(`Order not found: ${orderIdOrMongoId}`);
  }

  // 2. Check if already processed
  if (order.status === 'Paid') {
    console.log(`✅ Order ${order.orderId} already marked as Paid. Skipping finalization.`);
    return { success: true, alreadyProcessed: true, orderId: order.orderId };
  }

  console.log(`🔄 Finalizing order ${order.orderId} from ${source}...`);

  // 3. Update Order Status
  order.status = 'Paid';
  order.razorpay_payment_id = razorpayPaymentId;
  order.paymentAttempts = (order.paymentAttempts || 0) + 1;
  order.lastPaymentAttempt = new Date();
  if (order.createdVia !== 'express') {
    order.createdVia = source;
  }
  
  if (source === 'webhook') {
    order.webhookProcessed = true;
    order.webhookReceivedAt = new Date();
  }

  await order.save();
  console.log(`✅ Order status updated to Paid.`);

  // 4. Coupon Usage
  if (order.couponCode) {
    try {
      await Coupon.updateOne(
        { code: order.couponCode },
        { $inc: { usageCount: 1 } }
      );
      console.log(`✅ Coupon usage incremented: ${order.couponCode}`);
    } catch (error) {
      console.error(`⚠️ Failed to increment coupon usage:`, error);
    }
  }

  // 5. Swago Money Deduction — ✅ Now deducts from User directly
  if (order.swagoMoneyRedeemed > 0 && order.swagoMoneyKidId) {
    try {
      await User.updateOne(
        { _id: order.swagoMoneyKidId },
        { $inc: { "ambassador.swagoMoney": -order.swagoMoneyRedeemed } }
      );
      console.log(`💰 Deducted ${order.swagoMoneyRedeemed} SD from User ${order.swagoMoneyKidId}`);
    } catch (error) {
      console.error(`⚠️ Failed to deduct Swago Money:`, error);
    }
  }

  // 6. Stock Management
  console.log(`📦 Processing stock for ${order.items.length} items...`);
  for (const item of order.items) {
    try {
      const productId = item.productId?.toString();
      if (!productId) continue;

      let product = await Product.findOne({ slug: productId });
      if (!product && isValidObjectId(productId)) {
        product = await Product.findById(productId);
      }

      if (product) {
        const quantity = item.quantity || 1;
        const bomManaged = await hasActiveBomConfig(product._id);

        product.totalSold = (product.totalSold || 0) + quantity;
        if (!bomManaged) {
          product.stock = Math.max(0, product.stock - quantity);
        }
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);

        await product.save();
        console.log(`✅ Stock updated for ${product.name}: -${quantity}${bomManaged ? " (BOM-synced)" : ""}`);

        // Invalidate cache
        try {
          invalidateProductCache(product.slug || '');
          invalidateProductCache(product._id.toString());
        } catch (e) {
          console.error(`⚠️ Cache invalidation failed for ${product.name}`);
        }
      }
    } catch (error) {
      console.error(`⚠️ Failed to update stock for item ${item.name}:`, error);
    }
  }

  // Inventory item-level deduction
  await deductInventoryForOrder(order);

  // 7. Update User Profile
  try {
    const user = await User.findById(order.userId);
    if (user) {
      let userUpdated = false;
      if (!user.phone && order.phone) {
        user.phone = order.phone;
        userUpdated = true;
      }
      if (!user.email && order.email) {
        user.email = order.email;
        userUpdated = true;
      }
      if (userUpdated) {
        await user.save();
        console.log(`✅ User profile updated with contact info.`);
      }
    }
  } catch (error) {
    console.error(`⚠️ Failed to update user profile:`, error);
  }

  // 8. Send Email
  try {
    const orderObject = order.toObject();
    await sendOrderConfirmationEmail({
      name: orderObject.name,
      orderNumber: orderObject.orderId || orderObject._id.toString().slice(-6),
      orderDate: new Date(orderObject.createdAt).toLocaleString('en-IN'),
      email: orderObject.email,
      items: orderObject.items,
      subtotal: orderObject.subtotal.toFixed(2),
      discount: orderObject.discount.toFixed(2),
      swagoMoneyRedeemed: (orderObject.swagoMoneyRedeemed || 0).toFixed(2),
      shipping: (orderObject.shippingFee || 0).toFixed(2),
      totalAmount: orderObject.total.toFixed(2),
      paymentMethod: "Online (Razorpay)",
      paymentStatus: "Successful",
      address: orderObject.address,
      city: orderObject.city,
      state: orderObject.state,
      pincode: orderObject.pincode,
    });
    console.log(`📧 Confirmation email sent.`);

    // ✅ Fire Admin Email Asynchronously
    const adminItems = orderObject.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
    }));

    sendAdminOrderNotificationEmail({
        orderNumber: orderObject.orderId || orderObject._id.toString().slice(-6),
        orderDate: new Date(orderObject.createdAt).toLocaleString('en-IN'),
        customerName: orderObject.name,
        customerEmail: orderObject.email,
        customerPhone: orderObject.phone || "N/A",
        shippingMethod: "Standard Shipping",
        paymentMethod: "Online (Razorpay)",
        totalAmount: orderObject.total.toFixed(2),
        subtotal: orderObject.subtotal.toFixed(2),
        discount: orderObject.discount.toFixed(2),
        couponCode: orderObject.couponCode,
        swagoMoneyRedeemed: (orderObject.swagoMoneyRedeemed || 0).toFixed(2),
        shippingFee: (orderObject.shippingFee || 0).toFixed(2),
        items: adminItems,
        adminUrl: `https://admin.swagojr.com/orders/${orderObject._id}`
    }).catch(console.error);

  } catch (error) {
    console.error(`⚠️ Failed to send confirmation email:`, error);
  }

  // 9. Generate Invoice in background
  generateAndUploadInvoice(order).catch(err => {
    console.error(`⚠️ Failed to generate invoice in background:`, err);
  });

  return { success: true, orderId: order.orderId };
}

/**
 * Handles failed payments by marking order as Failed and releasing reserved stock.
 */
export async function handleFailedOrder(orderIdOrMongoId: string) {
  await connectDB();

  let order = await Order.findOne({ orderId: orderIdOrMongoId });
  if (!order && isValidObjectId(orderIdOrMongoId)) {
    order = await Order.findById(orderIdOrMongoId);
  }
  if (!order && orderIdOrMongoId.startsWith("order_")) {
    order = await Order.findOne({ razorpay_order_id: orderIdOrMongoId });
  }

  if (!order) return;

  if (order.status === 'Pending') {
    order.status = 'Failed';
    order.paymentAttempts = (order.paymentAttempts || 0) + 1;
    order.lastPaymentAttempt = new Date();
    await order.save();
    console.log(`❌ Order ${order.orderId} marked as Failed.`);

    // Release reserved stock
    console.log(`🔓 Releasing reserved stock for ${order.items.length} items...`);
    for (const item of order.items) {
      try {
        const productId = item.productId?.toString();
        if (!productId) continue;

        let product = await Product.findOne({ slug: productId });
        if (!product && isValidObjectId(productId)) {
          product = await Product.findById(productId);
        }

        if (product) {
          const quantity = item.quantity || 1;
          product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
          await product.save();
          console.log(`✅ Reserved stock released for ${product.name}: ${quantity}`);
          
          try {
            invalidateProductCache(product.slug || '');
            invalidateProductCache(product._id.toString());
          } catch (e) {}
        }
      } catch (error) {
        console.error(`⚠️ Failed to release reserved stock:`, error);
      }
    }
  }
}
