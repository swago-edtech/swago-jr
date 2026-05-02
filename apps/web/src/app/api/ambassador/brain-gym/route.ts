// apps/web/src/app/api/ambassador/brain-gym/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reelUrl, instagramUsername } = await request.json();

    if (!reelUrl || !instagramUsername) {
      return NextResponse.json(
        { error: "Instagram username and Reel URL are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const query = session.phone ? { phone: session.phone } : { email: session.email };
    const user = await User.findOne(query);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize ambassador if needed
    if (!user.ambassador) {
      user.ambassador = {};
    }

    // Update brain gym challenge status
    user.ambassador.brainGym = {
      completed: true,
      reelUrl: reelUrl.trim(),
      instagramUsername: instagramUsername.trim(),
      submittedAt: new Date(),
      status: "pending",
    };

    user.markModified('ambassador.brainGym');
    await user.save();

    console.log(`🧠 Brain Gym submitted for user: ${user.name} (${user.email || user.phone})`);
    console.log(`🔗 Reel URL: ${reelUrl}`);


    return NextResponse.json({
      success: true,
      message: "Brain Gym reel submitted successfully! Reward will be added after review.",
    });
  } catch (error) {
    console.error("Brain Gym submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit Brain Gym entry" },
      { status: 500 }
    );
  }
}
