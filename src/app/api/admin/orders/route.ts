import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getLoginSession } from "@/lib/auth";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET() {
  try {
    await connectDB();

    // Step 1: Verify the user is a logged-in admin
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await User.findOne({ phone: session.phone });
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Step 2: If user is an admin, fetch all orders
    // We sort by `createdAt: -1` to show the newest orders first
    const orders = await Order.find({}).sort({ createdAt: -1 });

    // Step 3: Return the list of orders
    return NextResponse.json(orders);
    
  } catch (error) {
    console.error("Failed to fetch all orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}