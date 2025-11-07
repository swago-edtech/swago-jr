import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User } from "@swago/database";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import { render } from "@react-email/render";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { z } from "zod";

// Type definitions
type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type OrderItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

const orderDetailsSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  age: z.string().trim().min(1, "Age is required"),
  address: z.string().trim().min(3, "Address must be at least 3 characters"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  cart: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional(),
  })).min(1),
  coupon: z.object({
    code: z.string(),
    description: z.string(),
    type: z.string(),
    value: z.number(),
  }).nullable().optional(),
  discount: z.object({
    amount: z.number(),
    originalAmount: z.number(),
    finalAmount: z.number(),
    savedAmount: z.number(),
  }).nullable().optional(),
  originalAmount: z.number(),
  finalAmount: z.number(),
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

    // 🔥 NEW: Check if webhook already created this order
    const existingOrder = await Order.findOne({ razorpay_payment_id });

    if (existingOrder) {
      console.log('✅ Order already created by webhook:', existingOrder._id);
      
      // Ensure user has this order in their list (if not already)
      if (!user.orders.includes(existingOrder._id)) {
        user.orders.push(existingOrder._id);
        await user.save();
        console.log('✅ Added order to user orders list');
      }
      
      // Update user email if not set
      if (!user.email && orderDetails.email) {
        user.email = orderDetails.email;
        await user.save();
        console.log('✅ Updated user email');
      }
      
      return NextResponse.json({ 
        success: true, 
        orderId: existingOrder._id,
        orderNumber: existingOrder._id.toString().slice(-6),
        source: 'webhook' // Indicate it was created by webhook
      });
    }

    // 🔥 BACKUP: If webhook hasn't created order yet, create it now
    console.log('⚠️ Webhook order not found, creating via verify route (backup)');

    if (!user.email) {
      user.email = orderDetails.email;
    }

    // Transform cart items to include productId
    const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    }));

    // Calculate totals
    const calculatedSubtotal = orderItems.reduce(
      (sum: number, item: OrderItem) => sum + (item.price * item.quantity), 
      0
    );
    
    const subtotal = orderDetails.originalAmount || calculatedSubtotal;
    const discountAmount = orderDetails.discount?.savedAmount || 0;
    const total = orderDetails.finalAmount || (subtotal - discountAmount);

    const newOrder = await Order.create({
      phone: session.phone,
      email: orderDetails.email,
      name: orderDetails.name,
      age: orderDetails.age,
      address: orderDetails.address,
      city: orderDetails.city,
      state: orderDetails.state,
      pincode: orderDetails.pincode,
      status: "Paid",
      razorpay_payment_id: razorpay_payment_id,
      razorpay_order_id: razorpay_order_id,
      items: orderItems,
      subtotal: subtotal,
      discount: discountAmount,
      total: total,
      createdVia: 'frontend', // 🔥 Mark as created by verify route
      ...(orderDetails.coupon && {
        couponCode: orderDetails.coupon.code,
        couponDetails: orderDetails.coupon,
      }),
    });

    user.orders.push(newOrder._id);
    await user.save();

    const orderObject = newOrder.toObject();
    const orderTotal = orderObject.total || total;

    // Send email (wrapped in try-catch to not crash if email fails)
    try {
      const emailHtml = await render(
        OrderConfirmationEmail({
          customerName: orderObject.name,
          orderId: orderObject._id.toString(),
          orderDate: new Date(orderObject.createdAt).toLocaleString(),
          items: orderObject.items,
          totalAmount: orderTotal.toFixed(2),
        })
      );

      const msg = {
        to: orderObject.email,
        bcc: process.env.SENDER_EMAIL!,
        from: process.env.SENDER_EMAIL!,
        subject: `Your Swago Junior Order Confirmation #${orderObject._id.toString().slice(-6)}`,
        html: emailHtml,
      };

      await sgMail.send(msg);
      console.log('✅ Email sent via verify route');
    } catch (emailError) {
      console.error('⚠️ Email failed in verify route:', emailError);
      // Don't throw - order is already created
    }

    return NextResponse.json({ 
      success: true, 
      orderId: newOrder._id,
      orderNumber: orderObject._id.toString().slice(-6),
      source: 'frontend' // Indicate it was created by verify route
    });

  } catch (error) {
    console.error("Payment verification failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}