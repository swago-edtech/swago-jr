import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User } from "@swago/database"; // ✅ Updated to shared package
import { z } from "zod";
// Removed: import connectDB from "@/lib/db";
// Removed: import Order from "@/models/Order";
// Removed: import User from "@/models/User";

// Updated, stricter schema
const orderSchema = z.object({
  name: z.string().trim().regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces." }),
  age: z.string().trim().min(1, { message: "Age is required" }),
  address: z.string().trim().min(3, { message: "Address must be at least 3 characters long." }),
  cart: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })).min(1, { message: "Cart cannot be empty" }),
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
    
    const { name, age, address, cart } = validation.data;

    await connectDB(); // ✅ Now using shared package
    const user = await User.findOne({ phone: session.phone }); // ✅ Now using shared package
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const order = await Order.create({ // ✅ Now using shared package
      phone: session.phone,
      name,
      age,
      address,
      status: "Pending",
      items: cart,
    });

    user.orders.push(order._id);
    await user.save();

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}