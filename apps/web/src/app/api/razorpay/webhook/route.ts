import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB, Order, User, Product } from '@swago/database';
import type { RazorpayWebhookPayload } from '@swago/types';
import { sendOrderConfirmationEmail } from '@/lib/msg91-email';
import { isValidObjectId } from 'mongoose';
import { invalidateProductCache } from "@/lib/productCache";



// ✅ Type for order object items from database
interface OrderItemFromDb {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  _id?: string;
}



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



// ✅ Extended notes type
type ExtendedRazorpayNotes = {
  orderId?: string;           // ✅ NEW: Our custom order ID
  mongoOrderId?: string;      // ✅ NEW: MongoDB ObjectId
  loginPhone?: string;
  loginEmail?: string;
  phone?: string;
  email?: string;
  name?: string;
  age?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items?: string;
  subtotal?: string;
  discount?: string;
  couponDetails?: string;
  items_count?: string;
  has_discount?: string;
  coupon_code?: string;
  stock_reserved?: string;
  reservation_timestamp?: string;
  [key: string]: string | undefined;
};




// ========================================
// Helper to get product by ID or slug
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



export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔔 [${timestamp}] Webhook received`);

  try {
    const signature = req.headers.get('x-razorpay-signature');
    console.log('🔐 Signature present:', !!signature);

    const body = await req.text();
    console.log('📦 Body length:', body.length, 'bytes');

    const isValid = verifyWebhookSignature(body, signature);
    console.log('✅ Signature valid:', isValid);

    if (!isValid) {
      console.log('❌ Webhook rejected: Invalid signature');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }



    const event = JSON.parse(body);
    console.log('📋 Event type:', event.event);
    console.log('🆔 Payment ID:', event.payload?.payment?.entity?.id || 'N/A');



    if (event.event === 'payment.captured') {
      console.log('💰 Processing payment.captured event');
      await handlePaymentCaptured(event.payload);
    } else if (event.event === 'payment.failed') {
      console.log('⚠️ Processing payment.failed event');
      await handlePaymentFailed(event.payload);
    } else {
      console.log('ℹ️ Unhandled event type:', event.event);
    }



    console.log('✅ Webhook processed successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json({ received: true }, { status: 200 });



  } catch (error) {
    console.error('💥 Webhook error:', error);
    console.error('Stack:', (error as Error).stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}



function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.log('⚠️ No signature header found');
    return false;
  }



  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured');
    return false;
  }



  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');



  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    console.log('🔐 Signature verification:', isValid ? 'PASS' : 'FAIL');
    return isValid;
  } catch (error) {
    console.error('❌ Signature comparison error:', error);
    return false;
  }
}



async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payment.entity;

  console.log('💳 Payment ID:', payment.id);
  console.log('🆔 Razorpay Order ID:', payment.order_id);
  console.log('💰 Amount:', payment.amount / 100, 'INR');
  console.log('📧 Email:', payment.email);
  console.log('📱 Contact:', payment.contact);

  try {
    await connectDB();
    console.log('✅ Database connected');

    const notes = (payment.notes || {}) as ExtendedRazorpayNotes;
    console.log('📝 Notes - orderId:', notes.orderId);
    console.log('📝 Notes - mongoOrderId:', notes.mongoOrderId);


    // ========================================
    // ✅ NEW: Find existing order (not create)
    // ========================================
    let order = null;

    // Try to find by our orderId first
    if (notes.orderId) {
      order = await Order.findOne({ orderId: notes.orderId });
      console.log('🔍 Lookup by orderId:', notes.orderId, 'Found:', !!order);
    }

    // Fallback to razorpay_order_id
    if (!order && payment.order_id) {
      order = await Order.findOne({ razorpay_order_id: payment.order_id });
      console.log('🔍 Lookup by razorpay_order_id:', payment.order_id, 'Found:', !!order);
    }

    // Fallback to payment_id (for duplicate check)
    if (!order) {
      order = await Order.findOne({ razorpay_payment_id: payment.id });
      if (order) {
        console.log('⚠️ Duplicate webhook - Order found by payment_id:', order.orderId);
        return;
      }
    }

    if (!order) {
      console.error('❌ Order not found in database');
      console.error('   orderId:', notes.orderId);
      console.error('   razorpay_order_id:', payment.order_id);
      return;
    }


    // Already processed?
    if (order.status === 'Paid') {
      console.log('✅ Order already Paid (duplicate webhook):', order.orderId);
      return;
    }


    // ========================================
    // ✅ UPDATE ORDER STATUS TO PAID
    // ========================================
    order.status = 'Paid';
    order.razorpay_payment_id = payment.id;
    order.webhookProcessed = true;
    order.webhookReceivedAt = new Date();
    order.createdVia = 'webhook';
    order.paymentAttempts = (order.paymentAttempts || 0) + 1;
    order.lastPaymentAttempt = new Date();
    await order.save();

    console.log('✅ Order updated via webhook:', order.orderId);


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

      console.log(`✅ ${product.name}:`);
      console.log(`   📦 Stock: ${oldStock} → ${product.stock}`);
      console.log(`   🔒 Reserved: ${oldReserved} → ${product.reservedStock}`);
      console.log(`   📊 Total Sold: ${oldSold} → ${product.totalSold}`);

      try {
        invalidateProductCache(product.slug || '');
        invalidateProductCache(product._id.toString());
      } catch (cacheError) {
        console.error('⚠️ Cache invalidation failed:', cacheError);
      }
    }

    console.log('✅ Stock updated successfully');


    // ========================================
    // ✅ UPDATE USER PROFILE
    // ========================================
    const user = await User.findById(order.userId);

    if (user) {
      if (!user.phone && order.phone) {
        try {
          user.phone = order.phone;
          console.log('✅ Added phone to user:', order.phone);
        } catch (e) {
          console.log('⚠️ Could not add phone');
        }
      }

      if (!user.email && order.email) {
        try {
          user.email = order.email;
          console.log('✅ Added email to user:', order.email);
        } catch (e) {
          console.log('⚠️ Could not add email');
        }
      }

      await user.save();
    }


    // ========================================
    // ✅ SEND CONFIRMATION EMAIL
    // ========================================
    console.log('📧 Sending confirmation email...');
    const orderObject = order.toObject();

    const itemsHtml = orderObject.items.map((item: OrderItemFromDb) => `
      <tr class="item-row">
        <td class="item-name">${item.name}</td>
        <td class="item-qty">x${item.quantity}</td>
        <td class="item-price">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    try {
      await sendOrderConfirmationEmail({
        name: orderObject.name,
        orderNumber: orderObject.orderId || orderObject._id.toString().slice(-6),  // ✅ Use orderId
        orderDate: new Date(orderObject.createdAt).toLocaleString('en-IN'),
        email: orderObject.email,
        items: itemsHtml,
        totalAmount: orderObject.total.toFixed(2),
        address: orderObject.address,
        city: orderObject.city,
        state: orderObject.state,
        pincode: orderObject.pincode,
      });
      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.error('⚠️ Email failed (order still completed):', emailError);
    }


  } catch (error) {
    console.error('💥 Error in handlePaymentCaptured:', error);
    console.error('Payment ID:', payment.id);
    throw error;
  }
}



async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payment.entity;

  console.log('❌ Payment failed');
  console.log('💳 Payment ID:', payment.id);
  console.log('🆔 Razorpay Order ID:', payment.order_id);
  console.log('💰 Amount:', payment.amount / 100, 'INR');
  console.log('⚠️ Error code:', payment.error_code);
  console.log('📝 Error description:', payment.error_description);

  try {
    await connectDB();

    const notes = (payment.notes || {}) as ExtendedRazorpayNotes;


    // ========================================
    // ✅ NEW: Find and update order to Failed
    // ========================================
    let order = null;

    if (notes.orderId) {
      order = await Order.findOne({ orderId: notes.orderId });
    }

    if (!order && payment.order_id) {
      order = await Order.findOne({ razorpay_order_id: payment.order_id });
    }

    if (!order) {
      console.log('⚠️ Order not found for failed payment');
      return;
    }

    // Only update if still Pending
    if (order.status === 'Pending') {
      order.status = 'Failed';
      order.paymentAttempts = (order.paymentAttempts || 0) + 1;
      order.lastPaymentAttempt = new Date();
      await order.save();
      console.log('❌ Order marked as Failed:', order.orderId);
    } else {
      console.log('ℹ️ Order status is', order.status, '- not updating to Failed');
    }


    // ========================================
    // ✅ RELEASE RESERVED STOCK
    // ========================================
    console.log('🔓 Releasing reserved stock for', order.items.length, 'items');

    for (const item of order.items) {
      const productId = item.productId;
      if (!productId) continue;


      // Release stock for all products

      const product = await getProductById(productId);
      if (!product) continue;

      const quantity = item.quantity || 1;
      const oldReserved = product.reservedStock || 0;

      // Release reserved stock
      product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
      await product.save();

      console.log(`🔓 ${product.name}: Reserved ${oldReserved} → ${product.reservedStock}`);

      try {
        invalidateProductCache(product.slug || '');
        invalidateProductCache(product._id.toString());
      } catch (cacheError) {
        console.error('⚠️ Cache invalidation failed:', cacheError);
      }
    }

    console.log('✅ All reserved stock released');

  } catch (error) {
    console.error('⚠️ Error in handlePaymentFailed:', error);
  }
}
