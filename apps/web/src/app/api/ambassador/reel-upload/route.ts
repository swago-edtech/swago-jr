// apps/web/src/app/api/ambassador/reel-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

// Submit reel URL
export async function POST(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reelUrl, instagramUsername } = await request.json();

    if (!reelUrl) {
      return NextResponse.json(
        { error: "Reel URL is required" },
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

    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already submitted
    if (user.ambassador?.entryChallenge?.submitted) {
      return NextResponse.json(
        { error: "Entry challenge already submitted" },
        { status: 400 }
      );
    }

    // Initialize ambassador if needed
    if (!user.ambassador) {
      user.ambassador = {};
    }

    // Update entry challenge
    user.ambassador.entryChallenge = {
      submitted: true,
      reelUrl: reelUrl,
      instagramUsername: instagramUsername?.trim() || '',
      submittedAt: new Date(),
      status: "pending",
    };
    user.ambassador.status = "entry_pending";

    // Award 25 Swago Money for submission
    user.ambassador.swagoMoney = (user.ambassador.swagoMoney || 0) + 25;
    user.ambassador.totalEarnings = (user.ambassador.totalEarnings || 0) + 25;
    user.swagoMoney = (user.swagoMoney || 0) + 25;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Reel submitted successfully! 25 Swago Dollars added to your wallet.",
      swagoMoney: user.ambassador.swagoMoney,
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
export async function GET() {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      entryChallenge: user.ambassador?.entryChallenge || { submitted: false, status: "not_submitted" },
      currentStep: user.ambassador?.currentStep || 1,
      status: user.ambassador?.status || "not_started",
    });
  } catch (error) {
    console.error("Get reel status error:", error);
    return NextResponse.json(
      { error: "Failed to get reel status" },
      { status: 500 }
    );
  }
}
