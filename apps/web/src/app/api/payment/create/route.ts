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

    const { totalAmount, orderDetails } = await req.json(); // 🔥 CHANGED: Now accepting orderDetails
    
    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ 
        error: "Payment gateway not configured" 
      }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 🔥 CHANGED: Add order details to notes for webhook
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
      notes: {
        phone: session.phone,
        email: orderDetails.email,
        name: orderDetails.name,
        age: orderDetails.age,
        address: orderDetails.address,
        city: orderDetails.city,
        state: orderDetails.state,
        pincode: orderDetails.pincode,
        items: JSON.stringify(orderDetails.cart),
        subtotal: orderDetails.originalAmount.toString(),
        discount: (orderDetails.discount?.savedAmount || 0).toString(),
        couponDetails: orderDetails.coupon ? JSON.stringify(orderDetails.coupon) : null
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Payment creation error:", err.message);
    
    return NextResponse.json({ 
      error: "Internal Server Error",
      message: err.message
    }, { status: 500 });
  }
}