// apps/web/src/app/api/ambassador/activate/route.ts
import { NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find user from session
    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Initialize ambassador program on user
    await user.initializeAmbassador();

    return NextResponse.json({
      success: true,
      message: "Ambassador program activated!",
      swagoMoney: user.ambassador.swagoMoney,
      badge: "Swago Saviour",
    });
  } catch (error) {
    console.error("Ambassador activation error:", error);
    return NextResponse.json(
      { error: "Failed to activate ambassador program" },
      { status: 500 }
    );
  }
}
