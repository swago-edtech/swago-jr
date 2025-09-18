import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, age, address } = await req.json();

    // TODO: Replace with real logged-in user from session
    const phone = "9999999999"; // temp hardcoded for now
    let user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not logged in" },
        { status: 401 }
      );
    }

    // Update user details
    user.name = name;
    user.age = age;
    user.address = address;
    await user.save();

    // Create order (later: get cart items instead of hardcoded)
    const order = await Order.create({
      user: user._id,
      items: [
        { productId: "1", name: "Learning Kit A", price: 499, quantity: 1 },
      ],
      status: "Pending",
    });

    user.orders.push(order._id);
    await user.save();

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
