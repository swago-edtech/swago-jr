// apps/web/src/app/api/ambassador/reel-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

// Submit reel URL
export async function POST(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kidProfileId, reelUrl } = await request.json();

    if (!kidProfileId || !reelUrl) {
      return NextResponse.json(
        { error: "Kid profile ID and reel URL are required" },
        { status: 400 }
      );
    }

    // Validate Instagram URL
    const isValidInstagram = /instagram\.com\/(reel|p)\//.test(reelUrl);
    if (!isValidInstagram) {
      return NextResponse.json(
        { error: "Please provide a valid Instagram reel or post URL" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ FIX: Support both email and phone
    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await KidProfile.findOne({
      _id: kidProfileId,
      userId: user._id,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if already submitted
    if (profile.ambassador.entryChallenge.submitted) {
      return NextResponse.json(
        { error: "Entry challenge already submitted" },
        { status: 400 }
      );
    }

    // Update entry challenge
    profile.ambassador.entryChallenge = {
      submitted: true,
      reelUrl: reelUrl,
      submittedAt: new Date(),
      status: "pending",
    };
    profile.ambassador.status = "entry_pending";

    // Award 25 Swago Money for completion/submission
    user.swagoMoney = (user.swagoMoney || 0) + 25;
    
    // Also award to kid profile for consistency
    profile.ambassador.swagoMoney = (profile.ambassador.swagoMoney || 0) + 25;
    profile.ambassador.totalEarnings = (profile.ambassador.totalEarnings || 0) + 25;

    await profile.save();
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Reel submitted successfully! 25 Swago Dollars added to your wallet.",
      swagoMoney: user.swagoMoney,
    });
  } catch (error) {
    console.error("Reel submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit reel" },
      { status: 500 }
    );
  }
}

// Get reel status
export async function GET(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const kidProfileId = url.searchParams.get("kidProfileId");

    if (!kidProfileId) {
      return NextResponse.json(
        { error: "Kid profile ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ FIX: Support both email and phone
    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await KidProfile.findOne({
      _id: kidProfileId,
      userId: user._id,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entryChallenge: profile.ambassador.entryChallenge,
      currentStep: profile.ambassador.currentStep,
      status: profile.ambassador.status,
    });
  } catch (error) {
    console.error("Get reel status error:", error);
    return NextResponse.json(
      { error: "Failed to get reel status" },
      { status: 500 }
    );
  }
}
