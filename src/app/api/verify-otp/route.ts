import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import twilio from "twilio";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecret_superlong_key_123456"
);
const cookieName = "session";

export async function POST(req: Request) {
  const { phone, code } = await req.json();
  if (!phone || !code) {
    return NextResponse.json({ success: false, error: "Phone and code are required." }, { status: 400 });
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  try {
    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: `+91${phone}`, code });

    if (verification_check.status !== "approved") {
      return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
    }

    await connectDB();
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone });
    }

    const token = await new SignJWT({ phone })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // Updated: Return the user object along with success status
    const response = NextResponse.json({ success: true, user: user });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("Twilio verify error:", err);
    return NextResponse.json({ success: false, error: "Failed to verify OTP." }, { status: 500 });
  }
}