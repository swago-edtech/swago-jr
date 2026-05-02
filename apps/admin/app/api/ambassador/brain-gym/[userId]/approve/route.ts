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
    const { swagoMoneyReward = 15, notes = "" } = body;

    console.log(`🧠 Approving Brain Gym for user: ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.ambassador?.brainGym?.reelUrl) {
      return NextResponse.json({ error: "No Brain Gym reel submitted" }, { status: 400 });
    }

    // Update brain gym status
    user.ambassador.brainGym.status = "approved";
    user.ambassador.brainGym.reviewedAt = new Date();
    user.ambassador.brainGym.reviewNotes = notes;
    user.ambassador.brainGym.completed = true;

    // Award Swago Money
    user.ambassador.swagoMoney = (user.ambassador.swagoMoney || 0) + swagoMoneyReward;
    user.ambassador.totalEarnings = (user.ambassador.totalEarnings || 0) + swagoMoneyReward;

    await user.save();


    console.log(`✅ Brain Gym approved for user ${userId}. Awarded ${swagoMoneyReward} SD.`);

    return NextResponse.json({
      success: true,
      message: "Brain Gym approved successfully!",
      swagoMoney: user.ambassador.swagoMoney,
    });
  } catch (error) {
    console.error("Approve Brain Gym error:", error);
    return NextResponse.json(
      { error: "Failed to approve Brain Gym challenge" },
      { status: 500 }
    );
  }
}
