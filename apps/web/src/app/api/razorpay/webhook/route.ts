import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { finalizeOrder, handleFailedOrder } from '@/lib/payment-service';
import type { RazorpayWebhookPayload } from '@swago/types';

// ✅ Extended notes type
type ExtendedRazorpayNotes = {
  orderId?: string;           // ✅ Our custom order ID
  mongoOrderId?: string;      // ✅ MongoDB ObjectId
  [key: string]: string | undefined;
};

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔔 [${timestamp}] Webhook received`);

  try {
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.log('❌ Webhook rejected: Invalid signature');
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
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

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
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payment.entity;
  const notes = (payment.notes || {}) as ExtendedRazorpayNotes;
  
  // Use either custom orderId or razorpay_order_id for lookup
  const lookupId = notes.orderId || payment.order_id;

  if (!lookupId) {
    console.error('❌ No order ID found in webhook payload');
    return;
  }

  await finalizeOrder({
    orderIdOrMongoId: lookupId,
    razorpayPaymentId: payment.id,
    source: 'webhook'
  });
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payment.entity;
  const notes = (payment.notes || {}) as ExtendedRazorpayNotes;
  const lookupId = notes.orderId || payment.order_id;

  if (lookupId) {
    await handleFailedOrder(lookupId);
  }
}
