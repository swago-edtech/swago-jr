import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import twilio from "twilio";
import { connectDB, User } from "@swago/database"; // ✅ Keep shared package
import { z } from "zod";

const verifySchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  code: z.string().min(4, { message: "Code must be at least 4 digits." }),
});

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET 
);
const cookieName = "session";

// Demo credentials
const DEMO_PHONE = "9876543210";
const DEMO_OTP = "2356";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }
    const { phone, code } = validation.data;

    // ✅ Handle demo number verification
    if (phone === DEMO_PHONE) {
      if (code !== DEMO_OTP) {
        return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
      }
      // Skip Twilio verification for demo number, proceed directly to user creation
    } else {
      // ✅ Twilio verification for real numbers
      const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
      const verification_check = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID!)
        .verificationChecks.create({ to: `+91${phone}`, code });
      if (verification_check.status !== "approved") {
        return NextResponse.json({ success: false, error: "Invalid OTP" }, { status: 400 });
      }
    }

    // ✅ User creation/authentication logic (using shared packages)
    await connectDB(); // ✅ Shared package
    let user = await User.findOne({ phone }); // ✅ Shared package
    if (!user) {
      user = await User.create({ phone }); // ✅ Shared package
    }

    // ✅ Create JWT token
    const token = await new SignJWT({ phone })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // ✅ Create response
    const response = NextResponse.json({ success: true, user: user });

    // 🔥 SECURITY FIX: Different cookie config for development vs production
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      // Production: Secure cookies with HTTPS
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax", // 🔥 Critical for Vercel deployment
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    } else {
      // Development: Allow HTTP for network IP testing
      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: false, // 🔥 False for HTTP (network IP testing)
        sameSite: "lax", // 🔥 Still needed for consistency
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err: unknown) {
    console.error("OTP verification error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}