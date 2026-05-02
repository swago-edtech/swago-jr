import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();

    const { userId } = await params;
    const body = await request.json();
    const { notes = "" } = body;

    console.log(`🧠 Rejecting Brain Gym for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.ambassador?.brainGym) {
      return NextResponse.json({ error: "No Brain Gym record found" }, { status: 400 });
    }

    // Update status to rejected
    user.ambassador.brainGym.status = "rejected";
    user.ambassador.brainGym.reviewedAt = new Date();
    user.ambassador.brainGym.reviewNotes = notes;
    user.ambassador.brainGym.completed = false; // Allow resubmission

    await user.save();

    console.log(`❌ Brain Gym rejected for user ${userId}. Reason: ${notes}`);

    return NextResponse.json({
      success: true,
      message: "Brain Gym rejected successfully!",
    });
  } catch (error) {
    console.error("Reject Brain Gym error:", error);
    return NextResponse.json(
      { error: "Failed to reject Brain Gym challenge" },
      { status: 500 }
    );
  }
}
