import { connectDB, Order, User, Product, Coupon } from "@swago/database";
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from "./msg91-email";
import { invalidateProductCache } from "./productCache";
import { isValidObjectId } from "mongoose";
import { generateAndUploadInvoice } from "./invoice-service";
import {
  deductInventoryForOrder,
  markInventoryAllocationConsumed,
  releaseInventoryAllocation,
} from "./inventory-service";

interface FinalizeOrderOptions {
  orderIdOrMongoId: string;
  razorpayPaymentId: string;
  source: 'frontend' | 'webhook';
}

function buildOrderLookup(orderIdOrMongoId: string) {
  const orConditions: Record<string, string>[] = [{ orderId: orderIdOrMongoId }];
  if (isValidObjectId(orderIdOrMongoId)) {
    orConditions.push({ _id: orderIdOrMongoId });
  }
  if (orderIdOrMongoId.startsWith("order_")) {
    orConditions.push({ razorpay_order_id: orderIdOrMongoId });
  }
  return { $or: orConditions };
}

/**
 * Finalizes an order after a successful payment.
 */
export async function finalizeOrder({ orderIdOrMongoId, razorpayPaymentId, source }: FinalizeOrderOptions) {
  await connectDB();

  const lookup = buildOrderLookup(orderIdOrMongoId);

  const order = await Order.findOneAndUpdate(
    { ...lookup, status: "Pending" },
    {
      $set: {
        status: "Paid",
        razorpay_payment_id: razorpayPaymentId,
        lastPaymentAttempt: new Date(),
        ...(source === "webhook"
          ? { webhookProcessed: true, webhookReceivedAt: new Date() }
          : {}),
        ...(source !== "webhook" ? { createdVia: source } : {}),
      },
      $inc: { paymentAttempts: 1 },
    },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne(lookup);
    if (existing?.status === "Paid") {
      return { success: true, alreadyProcessed: true, orderId: existing.orderId };
    }
    throw new Error(`Order not found or not finalizable: ${orderIdOrMongoId}`);
  }

  console.log(`🔄 Finalizing order ${order.orderId} from ${source}...`);

  if (order.inventoryAllocationStatus === "allocated") {
    await markInventoryAllocationConsumed(order._id);
    order.inventoryAllocationStatus = "consumed";
  } else if (
    !order.inventoryAllocationStatus ||
    order.inventoryAllocationStatus === "none"
  ) {
    await deductInventoryForOrder(order);
  }

  if (order.couponCode) {
    try {
      await Coupon.updateOne(
        { code: order.couponCode },
        { $inc: { usageCount: 1 } }
      );
    } catch (error) {
      console.error(`⚠️ Failed to increment coupon usage:`, error);
    }
  }

  if (order.swagoMoneyRedeemed > 0 && order.swagoMoneyKidId) {
    try {
      await User.updateOne(
        { _id: order.swagoMoneyKidId },
        { $inc: { "ambassador.swagoMoney": -order.swagoMoneyRedeemed } }
      );
    } catch (error) {
      console.error(`⚠️ Failed to deduct Swago Money:`, error);
    }
  }

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
        product.totalSold = (product.totalSold || 0) + quantity;
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
        await product.save();

        try {
          invalidateProductCache(product.slug || "");
          invalidateProductCache(product._id.toString());
        } catch {
          // non-critical
        }
      }
    } catch (error) {
      console.error(`⚠️ Failed to update stock for item ${item.name}:`, error);
    }
  }

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
      if (userUpdated) await user.save();
    }
  } catch (error) {
    console.error(`⚠️ Failed to update user profile:`, error);
  }

  try {
    const orderObject = order.toObject();
    await sendOrderConfirmationEmail({
      name: orderObject.name,
      orderNumber: orderObject.orderId || orderObject._id.toString().slice(-6),
      orderDate: new Date(orderObject.createdAt).toLocaleString("en-IN"),
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

    const adminItems = orderObject.items.map((item: { name: string; quantity: number; price: number }) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price.toFixed(2),
    }));

    sendAdminOrderNotificationEmail({
      orderNumber: orderObject.orderId || orderObject._id.toString().slice(-6),
      orderDate: new Date(orderObject.createdAt).toLocaleString("en-IN"),
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
      adminUrl: `https://admin.swagojr.com/orders/${orderObject._id}`,
    }).catch(console.error);
  } catch (error) {
    console.error(`⚠️ Failed to send confirmation email:`, error);
  }

  generateAndUploadInvoice(order).catch((err) => {
    console.error(`⚠️ Failed to generate invoice in background:`, err);
  });

  return { success: true, orderId: order.orderId };
}

export async function handleFailedOrder(orderIdOrMongoId: string) {
  await connectDB();

  const lookup = buildOrderLookup(orderIdOrMongoId);
  const order = await Order.findOne(lookup);

  if (!order || order.status !== "Pending") return;

  order.status = "Failed";
  order.paymentAttempts = (order.paymentAttempts || 0) + 1;
  order.lastPaymentAttempt = new Date();
  await order.save();

  if (order.inventoryAllocationStatus === "allocated") {
    await releaseInventoryAllocation(order);
  }

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

        try {
          invalidateProductCache(product.slug || "");
          invalidateProductCache(product._id.toString());
        } catch {
          // non-critical
        }
      }
    } catch (error) {
      console.error(`⚠️ Failed to release reserved stock:`, error);
    }
  }
}
