// apps/web/src/app/api/razorpay/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB, Order, User } from '@swago/database';
import sgMail from '@sendgrid/mail';
import { render } from '@react-email/render';
import OrderConfirmationEmail from '@/emails/OrderConfirmationEmail';
import type { RazorpayWebhookPayload } from '@swago/types'; // 🔥 Import from shared package

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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

    const notes = payment.notes || {};
    console.log('📝 Notes found:', Object.keys(notes).length > 0);
    console.log('👤 Customer:', notes.name);
    console.log('📍 City:', notes.city);
    
    const orderItems = JSON.parse(notes.items || '[]');
    console.log('🛒 Cart items:', orderItems.length);
    
    const couponDetails = notes.couponDetails ? JSON.parse(notes.couponDetails) : null;
    if (couponDetails) {
      console.log('🎟️ Coupon applied:', couponDetails.code);
    }

    const newOrder = await Order.create({
      phone: notes.phone || '',
      email: notes.email || '',
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

    const user = await User.findOne({ phone: notes.phone });
    if (user) {
      console.log('👤 User found:', user.phone);
      if (!user.email) {
        user.email = notes.email || '';
        console.log('📧 User email updated');
      }
      user.orders.push(newOrder._id);
      await user.save();
      console.log('✅ User updated with new order');
    } else {
      console.log('⚠️ User not found for phone:', notes.phone);
    }

    console.log('📧 Preparing confirmation email...');
    const orderObject = newOrder.toObject();
    
    const emailHtml = await render(
      OrderConfirmationEmail({
        customerName: orderObject.name,
        orderId: orderObject._id.toString(),
        orderDate: new Date(orderObject.createdAt).toLocaleString(),
        items: orderObject.items,
        totalAmount: orderObject.total.toFixed(2),
      })
    );

    const msg = {
      to: orderObject.email,
      bcc: process.env.SENDER_EMAIL!,
      from: process.env.SENDER_EMAIL!,
      subject: `Your Swago Junior Order Confirmation #${orderObject._id.toString().slice(-6)}`,
      html: emailHtml,
    };

    await sgMail.send(msg);
    console.log('✅ Email sent to:', orderObject.email);
    console.log('📬 Order number:', orderObject._id.toString().slice(-6));

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
}