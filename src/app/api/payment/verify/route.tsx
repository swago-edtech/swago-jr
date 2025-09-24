import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import { render } from "@react-email/render";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { z } from "zod";

const orderDetailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  age: z.string().trim().min(1, "Age is required"),
  address: z.string().trim().min(3, "Address must be at least 3 characters"),
  cart: z.array(z.any()).min(1),
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderDetails } = body;

    const validation = orderDetailsSchema.safeParse(orderDetails);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.email) {
      user.email = orderDetails.email;
    }

    const newOrder = await Order.create({
      phone: session.phone,
      email: orderDetails.email,
      name: orderDetails.name,
      age: orderDetails.age,
      address: orderDetails.address,
      status: "Paid",
      razorpay_payment_id: razorpay_payment_id,
      items: orderDetails.cart,
    });

    user.orders.push(newOrder._id);
    await user.save();

    const orderObject = newOrder.toObject();

    // The fix is here: we've added types for 'sum' and 'item'
    const orderTotal = orderObject.items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0
    );

    const emailHtml = await render(
      <OrderConfirmationEmail
        customerName={orderObject.name}
        orderId={orderObject._id.toString()}
        orderDate={new Date(orderObject.createdAt).toLocaleString()}
        items={orderObject.items}
        totalAmount={orderTotal.toFixed(2)}
      />
    );

    const msg = {
      to: orderObject.email,
      bcc: process.env.SENDER_EMAIL!,
      from: process.env.SENDER_EMAIL!,
      subject: `Your Swago Junior Order Confirmation #${orderObject._id.toString().slice(-6)}`,
      html: emailHtml,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true, orderId: newOrder._id });

  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}