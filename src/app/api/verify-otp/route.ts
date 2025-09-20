import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import twilio from "twilio";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "supersecret_superlong_key_123456"
);
const cookieName = "session";

export async function POST(req: Request) {
  const { phone, code } = await req.json();

  if (!phone || !code) {
    return NextResponse.json(
      { success: false, error: "Phone number and code are required." },
      { status: 400 }
    );
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

  try {
    const verification_check = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks
      .create({ to: `+91${phone}`, code: code });

    if (verification_check.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    const token = await new SignJWT({ phone })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({ success: true });

    // ✅ FIXED: Await the cookies() function call
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;

  } catch (err: any) {
    console.error("Twilio verify error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP." },
      { status: 500 }
    );
  }
}