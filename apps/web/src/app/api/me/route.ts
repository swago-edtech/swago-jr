import { NextResponse } from "next/server";
import { getLoginSession, getDemoUserData } from "@/lib/auth";
import { connectDB, User } from "@swago/database"; // ✅ Updated to shared package
// Removed: import connectDB from "@/lib/db";
// Removed: import User from "@/models/User";

export async function GET() {
  try {
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json(
        { loggedIn: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // ✅ NEW: Handle demo user
    if (session.isDemo) {
      const demoUser = getDemoUserData();
      return NextResponse.json({
        loggedIn: true,
        user: {
          ...demoUser,
          orders: [], // Demo user has no orders initially
          _id: "demo-user-id", // Fake ID for demo user
        },
      });
    }

    // ✅ Original logic for real users
    await connectDB(); // This now uses the shared package function
    const user = await User.findOne({ phone: session.phone }).populate("orders");

    if (!user) {
      return NextResponse.json(
        { loggedIn: false, message: "User not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      loggedIn: true,
      user: user,
    });
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      { loggedIn: false, error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}