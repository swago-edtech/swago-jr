// apps/web/src/app/api/express/verify/route.ts
// PUBLIC endpoint — no authentication required.
// Verifies Razorpay payment for Express Checkout orders,
// then creates a JWT session cookie so the user is automatically logged in.

import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, Order } from "@swago/database";
import { finalizeOrder } from "@/lib/payment-service";
import crypto from "crypto";
import { z } from "zod";

// ✅ JWT config
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// ✅ Input validation
const verifySchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ========================================
    // 1. VALIDATE INPUT
    // ========================================
    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payment data", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // ========================================
    // 2. VERIFY RAZORPAY SIGNATURE
    // ========================================
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", razorpaySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ [Express Verify] Invalid Razorpay signature");
      return NextResponse.json(
        { success: false, error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log("✅ [Express Verify] Signature verified");

    // ========================================
    // 3. FIND ORDER
    // ========================================
    await connectDB();

    const order = await Order.findOne({ razorpay_order_id }).populate("userId");

    if (!order) {
      console.error("❌ [Express Verify] Order not found for:", razorpay_order_id);
      return NextResponse.json(
        { success: false, error: "Order not found. Please contact support." },
        { status: 404 }
      );
    }

    console.log("✅ [Express Verify] Found order:", order.orderId, "Status:", order.status);

    // Check if already processed
    if (order.status === "Paid") {
      console.log("✅ [Express Verify] Already paid:", order.orderId);

      // Still create session cookie even if already processed
      const sessionPhone = order.phone;
      if (sessionPhone) {
        const token = await new SignJWT({ phone: sessionPhone })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(secret);

        const isProduction = process.env.NODE_ENV === "production";
        const response = NextResponse.json({
          success: true,
          orderId: order.orderId,
          source: "already_processed",
        });

        response.cookies.set(cookieName, token, {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }

      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        source: "already_processed",
      });
    }

    // ========================================
    // 4. FINALIZE ORDER (shared service)
    // ========================================
    const result = await finalizeOrder({
      orderIdOrMongoId: order.orderId || order._id.toString(),
      razorpayPaymentId: razorpay_payment_id,
      source: "frontend",
    });

    console.log("✅ [Express Verify] Order finalized:", result.orderId);

    // ========================================
    // 5. CREATE JWT SESSION (auto-login)
    // ========================================
    const sessionPhone = order.phone;

    if (!sessionPhone) {
      // Edge case: order has no phone (shouldn't happen with express)
      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        source: "express",
      });
    }

    const token = await new SignJWT({ phone: sessionPhone })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      orderId: result.orderId,
      source: "express",
    });

    // ✅ Set session cookie — user is now logged in
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("✅ [Express Verify] Session cookie set for:", sessionPhone);

    return response;
  } catch (error) {
    console.error("❌ [Express Verify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
