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

    if (!notes.trim()) {
      return NextResponse.json(
        { error: "Rejection notes are required" },
        { status: 400 }
      );
    }

    console.log(`❌ Rejecting reel for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.ambassador?.entryChallenge?.submitted) {
      return NextResponse.json({ error: "No reel submitted" }, { status: 400 });
    }

    // Update entry challenge status
    user.ambassador.entryChallenge.status = "rejected";
    user.ambassador.entryChallenge.reviewedAt = new Date();
    user.ambassador.entryChallenge.reviewNotes = notes;

    // Update ambassador status
    user.ambassador.status = "entry_rejected";

    await user.save();

    console.log(`✅ Reel rejected for user ${userId}.`);

    return NextResponse.json({
      success: true,
      message: "Reel rejected.",
    });
  } catch (error) {
    console.error("Reject reel error:", error);
    return NextResponse.json(
      { error: "Failed to reject reel" },
      { status: 500 }
    );
  }
}
