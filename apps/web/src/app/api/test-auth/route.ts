// apps/web/src/app/api/test-auth/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User } from "@swago/database";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "test-secret");
const cookieName = "session";

// Demo credentials
const DEMO_PHONE = "+919876543210";
const DEMO_OTP = "123456";

export async function POST(req: Request) {
  // Only allow in development/test mode
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test auth not available in production" },
      { status: 403 }
    );
  } 

  try {
    const body = await req.json();
    const { phone, otp } = body;

    // Verify demo credentials
    if (phone !== DEMO_PHONE || otp !== DEMO_OTP) {
      return NextResponse.json(
        { error: "Invalid test credentials" },
        { status: 401 }
      );
    }

    // Connect to database and find/create demo user
    await connectDB();
    let user = await User.findOne({ phone: DEMO_PHONE });
    
    if (!user) {
      user = await User.create({ 
        phone: DEMO_PHONE,
        name: "Test User",
        email: "test@swago-jr.com"
      });
    }

    // Create JWT session token
    const token = await new SignJWT({ phone: DEMO_PHONE })
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

    // Set session cookie
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: false, // Allow HTTP in dev
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
    
  } catch (err: unknown) {
    console.error("Test auth error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { error: message }, 
      { status: 500 }
    );
  }
}