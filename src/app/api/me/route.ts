import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import connectDB from "@/lib/db"; // Use the new default export
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB(); // This now guarantees all models are registered
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json(
        { loggedIn: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

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