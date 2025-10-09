import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import { getLoginSession } from "@/lib/auth"; // ✅ Added authentication

export async function POST(req: Request) {
  try {
    // 🔥 FIXED: Added authentication check
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const { name, phone, age, address, cart } = await req.json();

    // ✅ Use phone from authenticated session (more secure)
    const userPhone = session.phone;

    // Create order
    const order = await Order.create({ 
      name, 
      phone: userPhone, // Use authenticated phone
      age, 
      address, 
      cart 
    });

    // Find or create user
    let user = await User.findOne({ phone: userPhone });
    if (!user) {
      user = await User.create({
        name,
        phone: userPhone,
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
    console.error("Checkout error:", error);
    return NextResponse.json({ success: false, error: "Failed to save order" }, { status: 500 });
  }
}