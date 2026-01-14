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

    if (!reviewNotes || !reviewNotes.trim()) {
      return NextResponse.json({ error: "Review notes are required for rejection" }, { status: 400 });
    }

    console.log(`❌ Rejecting reel for kid profile: ${kidProfileId}`);

    await connectDB();

    const profile = await KidProfile.findById(kidProfileId);
    if (!profile) {
      return NextResponse.json({ error: "Kid profile not found" }, { status: 404 });
    }

    if (!profile.ambassador?.entryChallenge?.submitted) {
      return NextResponse.json({ error: "No reel submitted" }, { status: 400 });
    }

    profile.ambassador.entryChallenge.status = "rejected";
    profile.ambassador.entryChallenge.reviewedAt = new Date();
    profile.ambassador.entryChallenge.reviewNotes = reviewNotes;
    profile.ambassador.entryChallenge.submitted = false;
    profile.ambassador.status = "entry_rejected";

    await profile.save();

    console.log(`❌ Reel rejected for ${profile.username}. Kid can resubmit.`);

    return NextResponse.json({
      success: true,
      message: "Reel rejected. Kid can resubmit.",
    });
  } catch (error) {
    console.error("❌ Reject reel error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
