import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order } from "@swago/database";

export async function GET() {
  try {
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Demo users have no orders
    if (session.isDemo) {
      return NextResponse.json({
        success: true,
        orders: [],
        count: 0
      });
    }

    await connectDB();

    // Fetch user's orders using the optimized index (phone + createdAt)
    const orders = await Order.find({ phone: session.phone })
      .sort({ createdAt: -1 })  // Recent first
      .lean();  // Plain objects for better performance

    return NextResponse.json({
      success: true,
      orders,
      count: orders.length
    });

  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}