import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot update profile" },
        { status: 403 }
      );
    }

    const { name, email, address } = await request.json();

    await connectDB();

    const user = await User.findOneAndUpdate(
      { phone: session.phone },
      {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}