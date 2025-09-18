import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// This API returns the "logged in" user
export async function GET() {
  try {
    await connectDB();

    // ⚠️ Temporary solution:
    // Replace this with session/cookie logic later
    const phone = "9999999999"; // mock logged in user
    const user = await User.findOne({ phone }).populate("orders");

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
