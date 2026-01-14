import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ kidProfileId: string }> } // ✅ CHANGED: Added Promise type
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kidProfileId } = await params; // ✅ CHANGED: Added await
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

    profile.ambassador.entryChallenge.status = "approved";
    profile.ambassador.entryChallenge.reviewedAt = new Date();
    profile.ambassador.entryChallenge.reviewNotes = reviewNotes || "Approved";
    profile.ambassador.swagoMoney += 100;
    profile.ambassador.totalEarnings += 100;
    profile.ambassador.currentStep = 3;
    profile.ambassador.status = "entry_approved";
    
    const hasBadge = profile.ambassador.badges.some((b: any) => b.name === "Brand Ambassador");
    if (!hasBadge) {
      profile.ambassador.badges.push({
        name: "Brand Ambassador",
        awardedAt: new Date(),
      });
    }

    await profile.save();

    console.log(`✅ Reel approved for ${profile.username}`);

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
