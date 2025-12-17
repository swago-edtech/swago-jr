import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB, Order, User, Product } from '@swago/database';
import type { RazorpayWebhookPayload } from '@swago/types';
import { sendOrderConfirmationEmail } from '@/lib/msg91-email';
import { isValidObjectId } from 'mongoose';
//import { invalidateProductCache } from '@/app/api/products/[slug]/route'; // ✅ NEW IMPORT
import { invalidateProductCache } from "@/lib/productCache";


// Type matching SharedContext CartItem
type CartItem = {
  id?: number;
  _id?: string;
  productId?: number;
  name: string;
  price: number;
  quantity: number;
  images?: string[];
  image?: string;
};


// Order item type
type OrderItem = {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};


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


// Coupon details type
type CouponDetails = {
  code: string;
  description: string;
  type: string;
  value: number;
} | null;


// ✅ Extended notes type
type ExtendedRazorpayNotes = {
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


// Safe JSON parser
function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('⚠️ JSON parse error:', error);
    return fallback;
  }
}


// ========================================
// ✅ Helper to get product by ID or slug
// ========================================
async function getProductById(id: string | number): Promise<ProductDocument | null> {
  try {
    const idString = id.toString();
    
    // Try slug first
    let product = await Product.findOne({ slug: idString });
    
    // Try MongoDB _id if valid ObjectId
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
    console.log('🆔 Event ID:', event.payload?.payment?.entity?.id || 'N/A');


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
  console.log('🆔 Order ID:', payment.order_id);
  console.log('💰 Amount:', payment.amount / 100, 'INR');
  console.log('📧 Email:', payment.email);
  console.log('📱 Contact:', payment.contact);
  
  try {
    await connectDB();
    console.log('✅ Database connected');


    const existingOrder = await Order.findOne({
      razorpay_payment_id: payment.id
    });


    if (existingOrder) {
      console.log('⚠️ Duplicate webhook - Order already exists:', existingOrder._id);
      console.log('📅 Original order created:', existingOrder.createdAt);
      return;
    }


    console.log('🆕 Creating new order...');


    const notes = (payment.notes || {}) as ExtendedRazorpayNotes;
    console.log('📝 Notes found:', Object.keys(notes).length > 0);
    console.log('👤 Customer:', notes.name);
    console.log('📍 City:', notes.city);
    console.log('🔒 Stock reserved:', notes.stock_reserved === 'true' ? 'Yes' : 'No');
    
    const cartItems = safeJsonParse<CartItem[]>(notes.items, []);
    
    // ========================================
    // ✅ STOCK MANAGEMENT: Convert reserved to actual reduction
    // ========================================
    console.log('🔄 Processing stock for', cartItems.length, 'items');
    
    for (const item of cartItems) {
      const productId = item._id || item.id || item.productId;
      if (!productId) {
        console.log('⚠️ Skipping item with no ID:', item.name);
        continue;
      }


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
      
      console.log(`✅ ${product.name}:`);
      console.log(`   📦 Stock: ${oldStock} → ${product.stock} (reduced by ${quantity})`);
      console.log(`   🔒 Reserved: ${oldReserved} → ${product.reservedStock}`);
      console.log(`   📊 Total Sold: ${oldSold} → ${product.totalSold}`);
      
      // ✅ NEW: Invalidate product cache
      try {
        invalidateProductCache(product.slug || '');
        invalidateProductCache(product._id.toString());
      } catch (cacheError) {
        console.error('⚠️ Cache invalidation failed (non-critical):', cacheError);
      }
    }
    
    console.log('✅ Stock updated successfully for all items');
    // ========================================
    
    const orderItems: OrderItem[] = cartItems.map((item: CartItem) => ({
      productId: item._id || item.id || item.productId || 0,
      name: item.name || 'Unknown Product',
      price: item.price || 0,
      quantity: item.quantity || 1,
      image: item.images?.[0] || item.image || '',
    }));
    
    console.log('🛒 Order items:', orderItems.length);
    if (orderItems.length > 0) {
      console.log('🔍 First item:', orderItems[0].name);
    }
    
    const couponDetails = safeJsonParse<CouponDetails>(notes.couponDetails, null);
    if (couponDetails) {
      console.log('🎟️ Coupon applied:', couponDetails.code);
    }


    const orderPhone = notes.phone || payment.contact || '';
    console.log('📱 Order/Delivery phone:', orderPhone);


    // Find user by login credentials
    let user = null;
    
    if (notes.loginPhone) {
      user = await User.findOne({ phone: notes.loginPhone });
      console.log('👤 User lookup by login phone:', notes.loginPhone, 'Found:', !!user);
    }
    
    if (!user && notes.loginEmail) {
      user = await User.findOne({ email: notes.loginEmail });
      console.log('👤 User lookup by login email:', notes.loginEmail, 'Found:', !!user);
    }
    
    if (!user && orderPhone) {
      user = await User.findOne({ phone: orderPhone });
      console.log('👤 Fallback: User lookup by delivery phone:', orderPhone, 'Found:', !!user);
    }
    
    if (!user && notes.email) {
      user = await User.findOne({ email: notes.email });
      console.log('👤 Fallback: User lookup by delivery email:', notes.email, 'Found:', !!user);
    }


    if (!user) {
      console.log('❌ User not found. Cannot create order without user.');
      console.log('Login credentials:', { phone: notes.loginPhone, email: notes.loginEmail });
      return;
    }


    const newOrder = await Order.create({
      userId: new mongoose.Types.ObjectId(user._id),
      phone: orderPhone,
      email: notes.email || payment.email || '',
      name: notes.name || '',
      age: notes.age || '',
      address: notes.address || '',
      city: notes.city || '',
      state: notes.state || '',
      pincode: notes.pincode || '',
      status: 'Paid',
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      items: orderItems,
      subtotal: parseFloat(notes.subtotal || '0'),
      discount: parseFloat(notes.discount || '0'),
      total: payment.amount / 100,
      couponCode: couponDetails?.code,
      couponDetails: couponDetails,
      createdVia: 'webhook',
      webhookProcessed: true,
      webhookReceivedAt: new Date()
    });


    console.log('✅ Order created:', newOrder._id);
    console.log('💵 Order total:', newOrder.total, 'INR');


    // Update user profile
    if (!user.phone && orderPhone) {
      try {
        user.phone = orderPhone;
        console.log('✅ Added phone to user profile:', orderPhone);
      } catch (phoneError: unknown) {
        const err = phoneError as { code?: number };
        if (err.code === 11000) {
          console.log('⚠️ Phone already in use');
        }
      }
    }
    
    if (!user.email && notes.email) {
      try {
        user.email = notes.email;
        console.log('✅ Added email to user profile:', notes.email);
      } catch (emailError: unknown) {
        const err = emailError as { code?: number };
        if (err.code === 11000) {
          console.log('⚠️ Email already in use');
        }
      }
    }
    
    user.orders.push(newOrder._id);
    await user.save();
    console.log('✅ User updated with new order');


    // Send confirmation email
    console.log('📧 Sending confirmation email...');
    const orderObject = newOrder.toObject();
    
    // ✅ FIXED: Proper typing instead of any
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
        orderNumber: orderObject._id.toString().slice(-6),
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
      console.error('⚠️ Email failed (order still created):', emailError);
    }


  } catch (error) {
    console.error('💥 Error in handlePaymentCaptured:', error);
    console.error('Payment ID:', payment.id);
    console.error('Stack:', (error as Error).stack);
    throw error;
  }
}


async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payment.entity;
  
  console.log('❌ Payment failed');
  console.log('💳 Payment ID:', payment.id);
  console.log('🆔 Order ID:', payment.order_id);
  console.log('💰 Amount:', payment.amount / 100, 'INR');
  console.log('📧 Email:', payment.email);
  console.log('⚠️ Error code:', payment.error_code);
  console.log('📝 Error description:', payment.error_description);
  console.log('🔍 Error reason:', payment.error_reason);
  
  // ========================================
  // ✅ STOCK MANAGEMENT: Release reserved stock
  // ========================================
  try {
    await connectDB();
    
    const notes = (payment.notes || {}) as ExtendedRazorpayNotes;
    const stockReserved = notes.stock_reserved === 'true';
    
    if (!stockReserved) {
      console.log('ℹ️ No stock was reserved for this order');
      return;
    }
    
    const cartItems = safeJsonParse<CartItem[]>(notes.items, []);
    
    if (cartItems.length === 0) {
      console.log('ℹ️ No cart items to process');
      return;
    }
    
    console.log('🔓 Releasing reserved stock for', cartItems.length, 'items');
    
    for (const item of cartItems) {
      const productId = item._id || item.id || item.productId;
      if (!productId) {
        console.log('⚠️ Skipping item with no ID');
        continue;
      }


      const product = await getProductById(productId);
      if (!product) {
        console.log(`⚠️ Product not found: ${item.name}`);
        continue;
      }


      const quantity = item.quantity || 1;
      const oldReserved = product.reservedStock || 0;
      
      // Release reserved stock
      product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
      await product.save();
      
      console.log(`🔓 ${product.name}: Reserved ${oldReserved} → ${product.reservedStock} (released ${quantity})`);
      
      // ✅ NEW: Invalidate product cache
      try {
        invalidateProductCache(product.slug || '');
        invalidateProductCache(product._id.toString());
      } catch (cacheError) {
        console.error('⚠️ Cache invalidation failed (non-critical):', cacheError);
      }
    }
    
    console.log('✅ All reserved stock released');
    
  } catch (error) {
    console.error('⚠️ Error releasing reserved stock:', error);
  }
  // ========================================
}
