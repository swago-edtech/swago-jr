import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User, Product, Coupon, KidProfile } from "@swago/database";
import crypto from "crypto";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/msg91-email";
import { isValidObjectId } from "mongoose";
import { invalidateProductCache } from "@/lib/productCache";



// ✅ Type for product document
interface ProductDocument {
  _id: string;
  name: string;
  slug?: string;
  stock: number;
  reservedStock?: number;
  totalSold?: number;
  save: () => Promise<void>;
  [key: string]: unknown;
}


// ✅ Type for order object items from database
interface OrderItemFromDb {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  _id?: string;
}


const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().optional(),  // ✅ Our custom orderId
});


// ========================================
// ✅ Helper to get product by ID or slug
// ========================================
async function getProductById(id: string | number): Promise<ProductDocument | null> {
  try {
    const idString = id.toString();

    let product = await Product.findOne({ slug: idString });

    if (!product && isValidObjectId(idString)) {
      product = await Product.findOne({ _id: idString });
    }

    return product as ProductDocument | null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}


export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }


    const body = await req.json();

    // Validate required fields
    const validation = verifyPaymentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;


    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");


    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }


    await connectDB();

    // ========================================
    // ✅ NEW: Find existing order by razorpay_order_id
    // ========================================
    console.log('🔍 Looking for order with razorpay_order_id:', razorpay_order_id);

    const order = await Order.findOne({ razorpay_order_id: razorpay_order_id });

    if (!order) {
      console.error('❌ Order not found for razorpay_order_id:', razorpay_order_id);
      return NextResponse.json({
        error: "Order not found. Please contact support.",
        razorpay_order_id: razorpay_order_id
      }, { status: 404 });
    }

    console.log('✅ Found order:', order.orderId, 'Current status:', order.status);

    // Check if already processed
    if (order.status === 'Paid') {
      console.log('✅ Order already marked as Paid:', order.orderId);
      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        mongoOrderId: order._id.toString(),
        source: 'already_processed'
      });
    }

    // ========================================
    // ✅ UPDATE ORDER STATUS TO PAID
    // ========================================
    order.status = 'Paid';
    order.razorpay_payment_id = razorpay_payment_id;
    order.paymentAttempts = (order.paymentAttempts || 0) + 1;
    order.lastPaymentAttempt = new Date();
    order.createdVia = 'frontend';
    await order.save();

    console.log('✅ Order updated to Paid:', order.orderId);

    // Increment coupon usage if applied
    if (order.couponCode) {
      await Coupon.updateOne(
        { code: order.couponCode },
        { $inc: { usageCount: 1 } }
      );
      console.log('✅ Coupon usage incremented:', order.couponCode);
    }

    // ========================================
    // ✅ SWAGO MONEY MANAGEMENT: Deduct from KidProfile
    // ========================================
    if (order.swagoMoneyRedeemed > 0 && order.swagoMoneyKidId) {
      try {
        await KidProfile.updateOne(
          { _id: order.swagoMoneyKidId },
          { $inc: { "ambassador.swagoMoney": -order.swagoMoneyRedeemed } }
        );
        console.log(`💰 Deducted ${order.swagoMoneyRedeemed} SD from KidProfile ${order.swagoMoneyKidId}`);
      } catch (kidError) {
        console.error('⚠️ Could not deduct Swago Money (non-critical, order is Paid):', kidError);
      }
    }


    // ========================================
    // ✅ STOCK MANAGEMENT: Convert reserved to sold
    // ========================================
    console.log('🔄 Processing stock for', order.items.length, 'items');

    for (const item of order.items) {
      const productId = item.productId;
      if (!productId) {
        console.log('⚠️ Skipping item with no ID:', item.name);
        continue;
      }


      // Update stock for all products

      const product = await getProductById(productId);

      if (!product) {
        console.log(`⚠️ Product not found: ${item.name} (ID: ${productId})`);
        continue;
      }

      const quantity = item.quantity || 1;

      // Store old values for logging
      const oldStock = product.stock;
      const oldReserved = product.reservedStock || 0;
      const oldSold = product.totalSold || 0;

      // Reduce actual stock
      product.stock = Math.max(0, product.stock - quantity);

      // Release reserved stock
      product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);

      // Increase total sold
      product.totalSold = (product.totalSold || 0) + quantity;

      await product.save();

      console.log(`✅ ${product.name} (verify route):`);
      console.log(`   📦 Stock: ${oldStock} → ${product.stock} (reduced by ${quantity})`);
      console.log(`   🔒 Reserved: ${oldReserved} → ${product.reservedStock}`);
      console.log(`   📊 Total Sold: ${oldSold} → ${product.totalSold}`);

      // Invalidate product cache
      try {
        invalidateProductCache(product.slug || '');
        invalidateProductCache(product._id.toString());
      } catch (cacheError) {
        console.error('⚠️ Cache invalidation failed (non-critical):', cacheError);
      }
    }

    console.log('✅ Stock updated successfully');
    // ========================================


    // ========================================
    // ✅ UPDATE USER PROFILE IF NEEDED
    // ========================================
    const user = await User.findById(order.userId);

    if (user) {
      // Update phone for email-only users
      if (!user.phone && order.phone) {
        try {
          user.phone = order.phone;
          await user.save();
          console.log('✅ Added phone to user profile:', order.phone);
        } catch (phoneError: unknown) {
          const err = phoneError as { code?: number };
          if (err.code === 11000) {
            console.log('⚠️ Phone already in use by another user');
          }
        }
      }

      // Update email for phone-only users
      if (!user.email && order.email) {
        try {
          user.email = order.email;
          await user.save();
          console.log('✅ Added email to user profile:', order.email);
        } catch (emailError: unknown) {
          const err = emailError as { code?: number };
          if (err.code === 11000) {
            console.log('⚠️ Email already in use by another user');
          }
        }
      }
    }


    // ========================================
    // ✅ SEND CONFIRMATION EMAIL
    // ========================================
    const orderObject = order.toObject();

    try {
      await sendOrderConfirmationEmail({
        name: orderObject.name,
        orderNumber: orderObject.orderId || orderObject._id.toString().slice(-6),  // ✅ Use orderId
        orderDate: new Date(orderObject.createdAt).toLocaleString('en-IN'),
        email: orderObject.email,
        items: orderObject.items,
        subtotal: orderObject.subtotal.toFixed(2),
        discount: orderObject.discount.toFixed(2),
        shipping: "0.00",
        totalAmount: orderObject.total.toFixed(2),
        paymentMethod: orderObject.paymentMethod === 'cod' ? "Cash on Delivery" : "Online (Razorpay)",
        paymentStatus: "Successful",
        address: orderObject.address,
        city: orderObject.city,
        state: orderObject.state,
        pincode: orderObject.pincode,
      });

      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.error('⚠️ Email failed (order still completed):', emailError);
    }


    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      mongoOrderId: order._id.toString(),
      source: 'frontend'
    });


  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
