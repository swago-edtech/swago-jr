import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getLoginSession } from "@/lib/auth";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    // ✅ Ensure user is authenticated
    const session = await getLoginSession();
    if (!session) {
      console.error("Payment creation failed: User not authenticated");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ Get total amount from request
    const { totalAmount } = await req.json();
    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }

    // ✅ Prepare Razorpay order options
    const options = {
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created successfully:", order.id);

    // ✅ Return order details
    return NextResponse.json(order);

  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}