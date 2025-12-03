// apps/web/src/app/api/verify-otp/route.tsx
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User } from "@swago/database";
import { z } from "zod";
import { formatPhoneForStorage } from "@/lib/msg91";

// Two validation schemas for different flows
const directOtpSchema = z.object({
  phone: z.string().min(10, { message: "Phone number is required" }),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  isDemo: z.boolean().optional(),
});

// ✅ UPDATED: Support both phone and email
const widgetSchema = z.object({
  accessToken: z.string().min(1, { message: "Access token is required" }),
  identifier: z.string().min(1, { message: "Phone or email is required" }), // ✅ Changed from 'phone'
  authMethod: z.enum(['phone', 'email']), // ✅ NEW: Explicitly tell us which method
  name: z.string().optional(),
  email: z.string().email().optional(), // ✅ Optional secondary email (for phone users)
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// Demo credentials
const DEMO_PHONE = "+919876543210";
const DEMO_OTP = "123456";

// Verify access token with MSG91
async function verifyAccessToken(accessToken: string): Promise<{ success: boolean; error?: string }> {
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
  
  if (!MSG91_AUTH_KEY) {
    return { success: false, error: "MSG91_AUTH_KEY not configured" };
  }

  try {
    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    // Check if this is widget flow (has accessToken) or direct flow (has otp)
    const isWidgetFlow = "accessToken" in body;

    if (isWidgetFlow) {
      // Widget flow: Verify access token
      const validation = widgetSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.format() },
          { status: 400 }
        );
      }

      const { accessToken, identifier, authMethod, name, email: secondaryEmail } = validation.data;

      console.log(`🔐 Widget flow: Verifying ${authMethod} for`, identifier);

      // Verify access token with MSG91
      const result = await verifyAccessToken(accessToken);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Invalid access token" },
          { status: 401 }
        );
      }

      // Token verified - proceed with user creation/login
      await connectDB();

      // ✅ Find user by phone OR email based on authMethod
      let user;
      if (authMethod === 'phone') {
        const formattedPhone = formatPhoneForStorage(identifier);
        user = await User.findOne({ phone: formattedPhone });

        if (!user) {
          // ✅ NEW USER: Create with phone + optional email
          user = await User.create({ 
            phone: formattedPhone,
            authMethod: 'phone',
            ...(name && { name }),
            ...(secondaryEmail && { email: secondaryEmail })
          });
          console.log("✅ New phone user created:", formattedPhone, "Name:", name);
        } else {
          console.log("✅ Existing phone user logged in:", formattedPhone);
        }
      } else {
        // authMethod === 'email'
        user = await User.findOne({ email: identifier });

        if (!user) {
          // ✅ NEW USER: Create with email
          user = await User.create({ 
            email: identifier,
            authMethod: 'email',
            ...(name && { name })
          });
          console.log("✅ New email user created:", identifier, "Name:", name);
        } else {
          console.log("✅ Existing email user logged in:", identifier);
        }
      }

      // ✅ Create JWT with appropriate identifier
      const jwtPayload = authMethod === 'phone' 
        ? { phone: user.phone } 
        : { email: user.email };

      const token = await new SignJWT(jwtPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      // Create response with user data
      const response = NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          phone: user.phone,
          email: user.email,
          name: user.name,
          authMethod: user.authMethod,
          wishlist: user.wishlist || [],
          orders: user.orders || [],
        },
      });

      // Set session cookie
      const isProduction = process.env.NODE_ENV === "production";

      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    } else {
      // Direct flow: Demo mode only (unchanged)
      const validation = directOtpSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.format() },
          { status: 400 }
        );
      }

      const { phone, otp, isDemo } = validation.data;
      const formattedPhone = formatPhoneForStorage(phone);

      if (!isDemo || formattedPhone !== DEMO_PHONE) {
        return NextResponse.json(
          { success: false, error: "Direct OTP verification disabled. Use widget flow." },
          { status: 403 }
        );
      }

      if (otp !== DEMO_OTP) {
        return NextResponse.json(
          { success: false, error: "Invalid demo OTP. Use 123456" },
          { status: 401 }
        );
      }

      console.log("🎭 Demo mode: OTP verified for", DEMO_PHONE);

      await connectDB();
      let user = await User.findOne({ phone: formattedPhone });

      if (!user) {
        user = await User.create({ 
          phone: formattedPhone,
          authMethod: 'phone'
        });
        console.log("✅ New demo user created:", formattedPhone);
      } else {
        console.log("✅ Demo user logged in:", formattedPhone);
      }

      const token = await new SignJWT({ phone: formattedPhone })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      const response = NextResponse.json({
        success: true,
        user: {
          _id: user._id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          authMethod: user.authMethod,
          wishlist: user.wishlist || [],
          orders: user.orders || [],
        },
      });

      const isProduction = process.env.NODE_ENV === "production";

      response.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }
  } catch (err: unknown) {
    console.error("❌ OTP verification error:", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
