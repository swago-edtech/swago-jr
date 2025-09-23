import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import crypto from "crypto"; // Node.js crypto module for verification

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    // --- Signature Verification ---
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    // --- End of Signature Verification ---

    // If the signature is valid, proceed to save the order to your database
    await connectDB();
    
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newOrder = await Order.create({
      phone: session.phone,
      name: orderDetails.name,
      age: orderDetails.age,
      address: orderDetails.address,
      status: "Paid", // Set status to Paid
      items: orderDetails.cart,
      razorpay_payment_id: razorpay_payment_id, // Save payment ID for reference
    });

    user.orders.push(newOrder._id);
    await user.save();

    return NextResponse.json({ success: true, orderId: newOrder._id });

  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}