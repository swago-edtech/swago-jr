import { NextResponse } from "next/server";
import connectDB from "@/lib/db"; // Corrected: Use default import
import Order from "@/models/Order";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, phone, age, address, cart } = await req.json();

    // Create order
    const order = await Order.create({ name, phone, age, address, cart });

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        name,
        phone,
        age,
        address,
        orders: [order._id],
      });
    } else {
      user.orders.push(order._id);
      await user.save();
    }

    return NextResponse.json({ success: true, order, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to save order" }, { status: 500 });
  }
}

//push