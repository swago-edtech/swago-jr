// apps/web/src/app/api/verify-otp/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User } from "@swago/database";
import { z } from "zod";
import { verifyFirebaseToken, formatPhoneForStorage } from "@/lib/firebase-admin";

const verifySchema = z.object({
  idToken: z.string().min(1, { message: "ID token is required" }),
  phone: z.string().min(10, { message: "Phone number is required" }),
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = verifySchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() }, 
        { status: 400 }
      );
    }
    
    const { idToken, phone } = validation.data;

    // Verify Firebase ID token with Admin SDK
    const verificationResult = await verifyFirebaseToken(idToken);
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" }, 
        { status: 401 }
      );
    }

    // Ensure phone is in E.164 format (+919876543210)
    const formattedPhone = formatPhoneForStorage(phone);

    // Verify the phone from token matches the submitted phone
    if (verificationResult.phoneNumber !== formattedPhone) {
      console.error('Phone mismatch:', {
        fromToken: verificationResult.phoneNumber,
        fromRequest: formattedPhone
      });
      return NextResponse.json(
        { success: false, error: "Phone number mismatch" }, 
        { status: 400 }
      );
    }

    // Connect to database and find/create user
    await connectDB();
    let user = await User.findOne({ phone: formattedPhone });
    
    if (!user) {
      user = await User.create({ phone: formattedPhone });
    }

    // Create JWT session token with new phone format
    const token = await new SignJWT({ phone: formattedPhone })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // Create response with user data
    const response = NextResponse.json({ 
      success: true, 
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        wishlist: user.wishlist || [],
        orders: user.orders || [],
      }
    });

    // Set session cookie (different config for dev/prod)
    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
    
  } catch (err: unknown) {
    console.error("OTP verification error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: message }, 
      { status: 500 }
    );
  }
}