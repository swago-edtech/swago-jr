import { NextResponse } from "next/server";
import { connectDB, Order, User } from "@swago/database"; // 🔥 CONVERTED: Using shared package
import { getLoginSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // ✅ SECURITY: Authentication check
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    
    // ✅ SECURITY: Removed 'phone' from body - use session phone instead
    const { name, age, address, cart } = await req.json();

    // ✅ SECURITY: Use phone from authenticated session (prevents spoofing)
    const userPhone = session.phone;

    // Create order
    const order = await Order.create({ 
      name, 
      phone: userPhone, // ✅ Uses authenticated phone
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
    console.error("Checkout error:", error); // ✅ Better logging
    return NextResponse.json({ success: false, error: "Failed to save order" }, { status: 500 });
  }
}