import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User } from "@swago/database";
import { z } from "zod";

const verifySchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  identifier: z.string().min(1, "Email is required"),
  authMethod: z.enum(['email']),
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// Verify access token with MSG91
async function verifyAccessToken(accessToken: string): Promise<{ success: boolean; error?: string }> {
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
  
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: "MSG91_AUTH_KEY not configured" };
  }

  try {
    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authkey: MSG91_AUTH_KEY,
        "access-token": accessToken,
      }),
    });

    const data = await response.json();

    console.log("📱 MSG91 Token Verification Response:", JSON.stringify(data, null, 2));

    if (response.ok && data.type === "success") {
      console.log("✅ Access token verified by MSG91");
      return { success: true };
    } else {
      console.error("❌ MSG91 token verification failed:", data);
      return { success: false, error: data.message || "Invalid access token" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ MSG91 token verification error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📥 Ambassador login request received:", {
      identifier: body.identifier,
      authMethod: body.authMethod,
    });

    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.issues);
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { accessToken, identifier } = validation.data;
    const normalizedEmail = identifier.toLowerCase().trim();

    console.log(`🔐 Ambassador login: Verifying email ${normalizedEmail}`);

    // Verify access token with MSG91
    const tokenResult = await verifyAccessToken(accessToken);
    if (!tokenResult.success) {
      console.error("❌ Token verification failed:", tokenResult.error);
      return NextResponse.json(
        { success: false, error: tokenResult.error || "Invalid OTP" },
        { status: 401 }
      );
    }

    console.log("✅ Token verified, connecting to database...");
    await connectDB();

    // Find existing user
    console.log("🔍 Finding user by email...");
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error("❌ User not found:", normalizedEmail);
      return NextResponse.json(
        { success: false, error: "Account not found. Please register first." },
        { status: 404 }
      );
    }

    console.log(`✅ User found:`, {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    });

    // Create JWT session
    console.log("🔑 Creating JWT session...");
    const token = await new SignJWT({ email: normalizedEmail })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Welcome back to the Swagoverse! 🎉",
      user: {
        _id: user._id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        address: user.address,
        authMethod: user.authMethod,
        wishlist: user.wishlist || [],
        orders: user.orders || [],
        cart: user.cart || [],
      },
    });

    const isProduction = process.env.NODE_ENV === "production";

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("🎉 Ambassador login completed successfully!");
    return response;
  } catch (error: unknown) {
    console.error("❌ Ambassador login error:", error);
    
    const message = error instanceof Error ? error.message : "Login failed. Please try again.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
