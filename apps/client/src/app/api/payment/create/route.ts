import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getLoginSession } from "@/lib/auth";

// Initialize the Razorpay instance with your keys
const razorpay = new Razorpay({
  // The fix is here: Use the NEXT_PUBLIC_ variable name
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    // Ensure the user is logged in before creating a payment order
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the total amount from the request body
    const { totalAmount } = await req.json();
    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }

    // Prepare the options for the Razorpay order
    const options = {
      amount: Math.round(totalAmount * 100), // Amount in the smallest currency unit (paise for INR)
      currency: "INR",
      receipt: `receipt_order_${new Date().getTime()}`, // Generate a unique receipt ID
    };

    // Use the Razorpay SDK to create the order
    const order = await razorpay.orders.create(options);

    // Send the created order details back to the browser
    return NextResponse.json(order);

  } catch (error) {
    console.error("Failed to create Razorpay order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}