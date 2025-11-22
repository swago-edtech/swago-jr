// apps/web/src/app/api/payment/create/route.ts

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getLoginSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { totalAmount, orderDetails } = await req.json();
    
    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials missing");
      return NextResponse.json({ 
        error: "Payment gateway not configured" 
      }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 🔥 FIX: Simplify notes - Razorpay has limitations on note size and format
    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`, // Shorter receipt ID
      notes: {
        phone: session.phone || "",
        email: orderDetails?.email || "",
        name: orderDetails?.name || "",
        // Only include essential data - avoid large JSON strings
        items_count: orderDetails?.cart?.length?.toString() || "0",
        has_discount: orderDetails?.discount ? "yes" : "no",
        coupon_code: orderDetails?.coupon?.code || "",
      }
    };

    console.log("Creating Razorpay order with options:", {
      ...options,
      key_id: process.env.RAZORPAY_KEY_ID ? "Present" : "Missing"
    });

    const order = await razorpay.orders.create(options);
    
    console.log("Razorpay order created:", order.id);

    return NextResponse.json(order);

  } catch (error: unknown) {
    // 🔥 FIX: Better error handling
    console.error("Payment creation error - Full error:", error);
    
    let errorMessage = "Failed to create payment order";
    let errorDetails = "";
    
    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
      errorDetails = error.stack || "";
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    console.error("Error message:", errorMessage);
    console.error("Error details:", errorDetails);
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
}