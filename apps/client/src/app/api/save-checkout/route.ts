import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import { getLoginSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    const { name, age, address, cartItems } = await req.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ phone: session.phone }); // Changed let to const
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    user.name = name;
    user.age = age;
    user.address = address;
    await user.save();

    const order = await Order.create({
      user: user._id,
      items: cartItems,
      status: "Pending",
    });

    user.orders.push(order._id);
    await user.save();

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) { // Changed any to unknown
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}