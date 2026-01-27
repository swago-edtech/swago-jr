// apps/web/src/app/api/ambassador/brain-gym/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

// Hardcoded riddle for testing
const TEST_RIDDLE = {
  question: "What is 2 + 2?",
  correctAnswer: "4",
  options: ["3", "4", "5", "6"],
  reward: 50,
};

// Get riddle
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

    // ✅ FIXED: Support both phone and email auth
    const user = session.phone
      ? await User.findOne({ phone: session.phone })
      : await User.findOne({ email: session.email });

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

    // Check if entry challenge is approved
    if (profile.ambassador?.entryChallenge?.status !== "approved") {
      return NextResponse.json(
        { error: "Brain Gym is locked. Complete Entry Challenge first!" },
        { status: 403 }
      );
    }

    // Check if already completed
    if (profile.ambassador?.brainGym?.completed) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        message: "You've already completed this challenge!",
      });
    }

    return NextResponse.json({
      success: true,
      riddle: {
        question: TEST_RIDDLE.question,
        options: TEST_RIDDLE.options,
        reward: TEST_RIDDLE.reward,
      },
    });
  } catch (error) {
    console.error("❌ Get riddle error:", error);
    return NextResponse.json(
      { error: "Failed to get riddle" },
      { status: 500 }
    );
  }
}

// Submit answer
export async function POST(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kidProfileId, answer } = await request.json();

    if (!kidProfileId || !answer) {
      return NextResponse.json(
        { error: "Kid profile ID and answer are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Support both phone and email auth
    const user = session.phone
      ? await User.findOne({ phone: session.phone })
      : await User.findOne({ email: session.email });

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

    // Check if entry challenge is approved
    if (profile.ambassador?.entryChallenge?.status !== "approved") {
      return NextResponse.json(
        { error: "Brain Gym is locked" },
        { status: 403 }
      );
    }

    // Check if already completed
    if (profile.ambassador?.brainGym?.completed) {
      return NextResponse.json(
        { error: "You've already completed this challenge" },
        { status: 400 }
      );
    }

    // Check answer
    const isCorrect = answer.trim() === TEST_RIDDLE.correctAnswer;

    if (isCorrect) {
      // Award Swago Money (keep at 50)
      profile.ambassador.swagoMoney += TEST_RIDDLE.reward;
      profile.ambassador.totalEarnings += TEST_RIDDLE.reward;

      // Award Brain Champion badge
      const hasBrainBadge = profile.ambassador.badges.some((b: { name: string }) => b.name === "Brain Champion");
      if (!hasBrainBadge) {
        profile.ambassador.badges.push({
          name: "Brain Champion",
          awardedAt: new Date(),
        });
      }

      // Update Brain Gym status
      profile.ambassador.brainGym = {
        completed: true,
        answer: answer,
        completedAt: new Date(),
      };

      // ✅ CHANGED: Don't auto-award Brand Ambassador badge from Brain Gym
      // Instead, check if 200 Swago Money threshold is met
      if (profile.ambassador.swagoMoney >= 200) {
        const hasAmbassadorBadge = profile.ambassador.badges.some((b: { name: string }) => b.name === "Brand Ambassador");
        if (!hasAmbassadorBadge) {
          profile.ambassador.badges.push({
            name: "Brand Ambassador",
            awardedAt: new Date(),
          });
          profile.ambassador.currentStep = 4;
          profile.ambassador.status = "brand_ambassador";
          console.log(`🎉 Brand Ambassador badge awarded via Brain Gym! Swago Money: ${profile.ambassador.swagoMoney}`);
        }
      }

      await profile.save();

      console.log(`✅ Brain Gym completed for ${profile.username}. Awarded ${TEST_RIDDLE.reward} Swago Money + Brain Champion badge.`);

      return NextResponse.json({
        success: true,
        correct: true,
        message: "Correct! You earned 50 Swago Dollars! 🎉",
        swagoMoney: profile.ambassador.swagoMoney,
      });
    } else {
      return NextResponse.json({
        success: true,
        correct: false,
        message: "Oops! Try again!",
      });
    }
  } catch (error) {
    console.error("❌ Submit answer error:", error);
    return NextResponse.json(
      { error: "Failed to submit answer" },
      { status: 500 }
    );
  }
}
