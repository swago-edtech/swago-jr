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
    const { swagoMoneyReward = 50, notes = "" } = body;

    console.log(`🎬 Approving reel for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.ambassador?.entryChallenge?.submitted) {
      return NextResponse.json({ error: "No reel submitted" }, { status: 400 });
    }

    // Update entry challenge status
    user.ambassador.entryChallenge.status = "approved";
    user.ambassador.entryChallenge.reviewedAt = new Date();
    user.ambassador.entryChallenge.reviewNotes = notes;

    // Update ambassador status
    user.ambassador.status = "entry_approved";
    user.ambassador.currentStep = 3;

    // Award Swago Money
    user.ambassador.swagoMoney = (user.ambassador.swagoMoney || 0) + swagoMoneyReward;
    user.ambassador.totalEarnings = (user.ambassador.totalEarnings || 0) + swagoMoneyReward;

    // Check for badge
    if (typeof user.checkAndAwardAmbassadorBadge === 'function') {
      user.checkAndAwardAmbassadorBadge();
    }

    await user.save();

    console.log(`✅ Reel approved for user ${userId}. Awarded ${swagoMoneyReward} SD.`);

    return NextResponse.json({
      success: true,
      message: "Reel approved successfully!",
      swagoMoney: user.ambassador.swagoMoney,
    });
  } catch (error) {
    console.error("Approve reel error:", error);
    return NextResponse.json(
      { error: "Failed to approve reel" },
      { status: 500 }
    );
  }
}
