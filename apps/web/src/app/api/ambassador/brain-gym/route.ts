// apps/web/src/app/api/ambassador/brain-gym/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

// Hardcoded riddle for testing
const TEST_RIDDLE = {
  question: "What is 2 + 2?",
  correctAnswer: "4",
  options: ["3", "4", "5", "6"],
  reward: 50,
};

// Get riddle
export async function GET() {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = session.phone
      ? await User.findOne({ phone: session.phone })
      : await User.findOne({ email: session.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if entry challenge is approved
    if (user.ambassador?.entryChallenge?.status !== "approved") {
      return NextResponse.json(
        { error: "Brain Gym is locked. Complete Entry Challenge first!" },
        { status: 403 }
      );
    }

    // Check if already completed
    if (user.ambassador?.brainGym?.completed) {
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

    const { answer } = await request.json();

    if (!answer) {
      return NextResponse.json(
        { error: "Answer is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = session.phone
      ? await User.findOne({ phone: session.phone })
      : await User.findOne({ email: session.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if entry challenge is approved
    if (user.ambassador?.entryChallenge?.status !== "approved") {
      return NextResponse.json(
        { error: "Brain Gym is locked" },
        { status: 403 }
      );
    }

    // Check if already completed
    if (user.ambassador?.brainGym?.completed) {
      return NextResponse.json(
        { error: "You've already completed this challenge" },
        { status: 400 }
      );
    }

    // Check answer
    const isCorrect = answer.trim() === TEST_RIDDLE.correctAnswer;

    if (isCorrect) {
      // Award Swago Money
      user.ambassador.swagoMoney += TEST_RIDDLE.reward;
      user.ambassador.totalEarnings += TEST_RIDDLE.reward;

      // Award Brain Champion badge
      const hasBrainBadge = user.ambassador.badges.some((b: { name: string }) => b.name === "Brain Champion");
      if (!hasBrainBadge) {
        user.ambassador.badges.push({
          name: "Brain Champion",
          awardedAt: new Date(),
        });
      }

      // Update Brain Gym status
      user.ambassador.brainGym = {
        completed: true,
        answer: answer,
        completedAt: new Date(),
      };

      // Check for Brand Ambassador badge at 200 Swago Money threshold
      user.checkAndAwardAmbassadorBadge();

      await user.save();

      console.log(`✅ Brain Gym completed for ${user.name || user.phone}. Awarded ${TEST_RIDDLE.reward} Swago Money + Brain Champion badge.`);

      return NextResponse.json({
        success: true,
        correct: true,
        message: "Correct! You earned 50 Swago Dollars! 🎉",
        swagoMoney: user.ambassador.swagoMoney,
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
