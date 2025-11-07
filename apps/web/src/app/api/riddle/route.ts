import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Riddle, User } from "@swago/database";

/**
 * GET - Get today's riddle for logged-in user
 */
export async function GET() {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date().toDateString();

    // Return same riddle if already fetched today
    if (user.lastRiddleDate === today && user.lastRiddleId) {
      const riddle = await Riddle.findById(user.lastRiddleId);
      return NextResponse.json({ riddle });
    }

    // Get random riddle
    const count = await Riddle.countDocuments();
    const random = Math.floor(Math.random() * count);
    const riddle = await Riddle.findOne().skip(random);

    // Save riddle info to user
    user.lastRiddleDate = today;
    user.lastRiddleId = riddle._id;
    await user.save();

    return NextResponse.json({ riddle });
  } catch (err) {
    console.error("Error fetching riddle:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST - Submit answer for today's riddle
 */
export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { answer } = await req.json();
    await connectDB();

    const user = await User.findOne({ phone: session.phone });
    if (!user || !user.lastRiddleId) {
      return NextResponse.json({ error: "No riddle found for today" }, { status: 400 });
    }

    const riddle = await Riddle.findById(user.lastRiddleId);
    const correct = riddle.answer.toLowerCase().trim() === answer.toLowerCase().trim();

    if (correct) {
      user.points = (user.points || 0) + 10;
      await user.save();
      return NextResponse.json({ correct: true, message: "✅ Correct answer! +10 points" });
    }

    return NextResponse.json({ correct: false, message: "❌ Wrong answer. Try again!" });
  } catch (err) {
    console.error("Error submitting riddle:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
