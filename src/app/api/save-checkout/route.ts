import { NextResponse } from "next/server";
import connectDB from "@/lib/db"; // Corrected import
import User from "@/models/User";
import Order from "@/models/Order";
import { getLoginSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    // ✅ Read session (user must be logged in via OTP)
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

    // ✅ Find user by phone
    let user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // ✅ Update user details
    user.name = name;
    user.age = age;
    user.address = address;
    await user.save();

    // ✅ Create new order
    const order = await Order.create({
      user: user._id,
      items: cartItems,
      status: "Pending",
    });

    // ✅ Link order to user
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