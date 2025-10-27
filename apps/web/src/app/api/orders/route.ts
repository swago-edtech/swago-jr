import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User } from "@swago/database";
import { z } from "zod";

// Updated schema to include all required fields
const orderSchema = z.object({
  name: z.string().trim().regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces." }),
  age: z.string().trim().min(1, { message: "Age is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  address: z.string().trim().min(3, { message: "Address must be at least 3 characters long." }),
  city: z.string().trim().min(2, { message: "City is required" }),
  state: z.string().trim().min(2, { message: "State is required" }),
  pincode: z.string().regex(/^\d{6}$/, { message: "Pincode must be 6 digits" }),
  cart: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
    image: z.string().optional(),
  })).min(1, { message: "Cart cannot be empty" }),
  // Optional fields for discounts/coupons
  discount: z.number().optional().default(0),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    
    const { name, age, email, address, city, state, pincode, cart, discount } = validation.data;

    await connectDB();
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - (discount || 0);

    // Transform cart items to include productId
    const orderItems = cart.map((item) => ({
      productId: item.id,        // Map id to productId
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    }));

    const order = await Order.create({
      phone: session.phone,
      email,
      name,
      age,
      address,
      city,
      state,
      pincode,
      status: "Pending",
      items: orderItems,
      subtotal,
      discount: discount || 0,
      total,
    });

    user.orders.push(order._id);
    await user.save();

    return NextResponse.json({ success: true, order, orderId: order._id });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET endpoint to fetch user orders
export async function GET(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    
    const orders = await Order.find({ phone: session.phone })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}