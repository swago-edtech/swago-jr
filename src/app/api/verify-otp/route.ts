import { NextResponse } from "next/server";
import twilio from "twilio";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Verify OTP and login user
export async function POST(req: Request) {
  const { phone, code } = await req.json();

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  try {
    // Step 1: Verify OTP with Twilio
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: `+91${phone}`, code });

    if (verificationCheck.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Step 2: Connect to MongoDB
    await connectDB();

    // Step 3: Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    // Step 4: Check if extra details are missing
    const needsDetails = !user.name || !user.address;

    // Step 5: Return response
    return NextResponse.json({ success: true, user, needsDetails });
  } catch (err: any) {
    console.error("Twilio verify error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
