import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import twilio from "twilio";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";

const verifySchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  code: z.string().min(4, { message: "Code must be at least 4 digits." }),
});

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET 
);
const cookieName = "session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    const { phone, code } = validation.data;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
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
    const response = NextResponse.json({ success: true, user: user });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err: unknown) { // Changed any to unknown
    console.error("OTP verification error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}