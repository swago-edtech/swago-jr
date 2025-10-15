import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getLoginSession } from "@/lib/auth";

// 🔥 REMOVED: No more module-level initialization

export async function POST(req: Request) {
  try {
    console.log("=== Payment Create API Called ===");
    
    // ✅ SECURITY: Check authentication
    const session = await getLoginSession();
    if (!session) {
      console.error("Payment creation failed: User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.log("✅ User authenticated:", session.phone);

    // ✅ SECURITY: Get total amount
    const { totalAmount } = await req.json();
    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }
    console.log("✅ Total amount:", totalAmount);

    // ✅ SECURITY: Validate Razorpay keys exist
    const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
    const hasSecret = !!process.env.RAZORPAY_KEY_SECRET;
    
    console.log("Razorpay Key ID exists:", hasKeyId);
    console.log("Razorpay Secret exists:", hasSecret);

    if (!hasKeyId || !hasSecret) {
      console.error("❌ RAZORPAY KEYS MISSING!");
      return NextResponse.json({ 
        error: "Payment gateway not configured. Please contact support.",
        debug: { hasKeyId, hasSecret }
      }, { status: 500 });
    }

    // ✅ SECURITY: Lazy initialization (inside request handler)
    console.log("Initializing Razorpay...");
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,      // 🔒 Server-only (not NEXT_PUBLIC)
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay initialized");

    // ✅ Create order
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    console.log("Creating Razorpay order with amount:", options.amount);
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);

    return NextResponse.json(order);

  } catch (error: unknown) {
    const err = error as Error;
    console.error("=== PAYMENT CREATION ERROR ===");
    console.error("Error type:", err.constructor?.name || "Unknown");
    console.error("Error message:", err.message || String(error));
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: err.message || String(error),
      type: err.constructor?.name || "Unknown"
    }, { status: 500 });
  }
}