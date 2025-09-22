import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import connectDB from "@/lib/db"; // The only change is here
import Order from "@/models/Order";
import User from "@/models/User";

export async function POST(req: Request) {
  const session = await getLoginSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await connectDB();
  const { name, age, address, cart } = await req.json();

  const user = await User.findOne({ phone: session.phone });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const order = await Order.create({
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
}