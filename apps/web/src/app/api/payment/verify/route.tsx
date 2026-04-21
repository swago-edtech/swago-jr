import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { finalizeOrder } from "@/lib/payment-service";
import { connectDB, Order } from "@swago/database";
import crypto from "crypto";
import { z } from "zod";

const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().optional(),  // ✅ Our custom orderId
});


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
    // ✅ FINALIZE ORDER USING SHARED SERVICE
    // ========================================
    const result = await finalizeOrder({
      orderIdOrMongoId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      source: 'frontend'
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      source: 'frontend'
    });


  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
