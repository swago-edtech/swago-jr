import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kidProfileId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kidProfileId } = await params;
    const body = await request.json();
    const { reviewNotes } = body;

    console.log(`🎬 Approving reel for kid profile: ${kidProfileId}`);

    await connectDB();

    const profile = await KidProfile.findById(kidProfileId);
    if (!profile) {
      return NextResponse.json({ error: "Kid profile not found" }, { status: 404 });
    }

    if (!profile.ambassador?.entryChallenge?.submitted) {
      return NextResponse.json({ error: "No reel submitted" }, { status: 400 });
    }

    // Update challenge status
    profile.ambassador.entryChallenge.status = "approved";
    profile.ambassador.entryChallenge.reviewedAt = new Date();
    profile.ambassador.entryChallenge.reviewNotes = reviewNotes || "Approved";

    // ✅ CHANGED: Award 25 Swago Money (as per new requirements)
    profile.ambassador.swagoMoney += 25;
    profile.ambassador.totalEarnings += 25;

    profile.ambassador.currentStep = 3;
    profile.ambassador.status = "entry_approved";

    // ✅ FIXED: Award "Entry Master" badge (was "Brand Ambassador")
    const hasBadge = profile.ambassador.badges.some((b: any) => b.name === "Entry Master");
    if (!hasBadge) {
      profile.ambassador.badges.push({
        name: "Entry Master",
        awardedAt: new Date(),
      });
    }

    await profile.save();

    console.log(`✅ Reel approved for ${profile.username}. Awarded 30 Swago Dollars + Entry Master badge.`);

    return NextResponse.json({
      success: true,
      message: "Reel approved successfully!",
      updatedProfile: {
        ambassador: {
          swagoMoney: profile.ambassador.swagoMoney,
          currentStep: profile.ambassador.currentStep,
          status: profile.ambassador.status,
        },
      },
    });
  } catch (error) {
    console.error("❌ Approve reel error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
