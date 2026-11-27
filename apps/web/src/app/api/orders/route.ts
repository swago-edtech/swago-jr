import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Order, User } from "@swago/database";

/**
 * Retired: orders are only created through /api/payment/create, /api/payment/cod
 * and /api/express/create-order, which validate the address and price the cart
 * server-side. This legacy endpoint accepted client prices and unvalidated
 * addresses, so it now returns 410 Gone.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "This endpoint has been retired. Please refresh the page and check out again.", code: "ENDPOINT_GONE" },
    { status: 410 }
  );
}

// 🔥 OPTIMIZED: Fetch by userId with fallback for old orders
export async function GET() {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    
    // ✅ Find user by login credentials (phone OR email)
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // ✅ Try fetching by userId first (new orders)
    let orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();
    
    console.log(`✅ Found ${orders.length} orders by userId`);
    
    // ✅ Fallback: Fetch old orders by phone/email (orders created before userId field)
    if (orders.length < 15) {
      const queryConditions = [];
      
      if (user.phone) {
        queryConditions.push({ phone: user.phone });
      }
      
      if (user.email) {
        queryConditions.push({ email: user.email });
      }
      
      if (queryConditions.length > 0) {
        const oldOrders = await Order.find({
          userId: { $exists: false },  // Only old orders without userId
          $or: queryConditions
        })
        .sort({ createdAt: -1 })
        .limit(15 - orders.length)
        .lean();
        
        console.log(`✅ Found ${oldOrders.length} old orders by phone/email fallback`);
        
        orders = [...orders, ...oldOrders];
      }
    }

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
