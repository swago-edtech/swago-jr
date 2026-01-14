// apps/web/src/app/api/ambassador/verify-otp/route.ts
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User, KidProfile } from "@swago/database";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  accessToken: z.string().min(1),
});

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "session";

// ✅ Type definition for pending registration data
interface PendingRegistrationData {
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  childName: string;
  childAge: number;
  gender: string;
  city: string;
}

// ✅ Extend global type for pending registrations map
declare global {
  // eslint-disable-next-line no-var
  var ambassadorPendingRegistrations: Map<string, PendingRegistrationData> | undefined;
}

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
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, accessToken } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify access token with MSG91
    const tokenResult = await verifyAccessToken(accessToken);
    if (!tokenResult.success) {
      return NextResponse.json(
        { error: tokenResult.error || "Invalid OTP" },
        { status: 401 }
      );
    }

    // Get pending registration data from memory/Redis
    const pendingData = global.ambassadorPendingRegistrations?.get(normalizedEmail);

    if (!pendingData) {
      return NextResponse.json(
        { error: "Registration session expired. Please start over." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check again if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "Account already exists" },
        { status: 400 }
      );
    }

    // Create parent user account
    const newUser = await User.create({
      email: normalizedEmail,
      phone: pendingData.parentPhone,
      name: pendingData.parentName,
      authMethod: "email",
      cart: [],
      wishlist: [],
      orders: [],
    });

    console.log(`✅ Ambassador parent account created: ${normalizedEmail}`);

    // Create kid profile with ambassador program activated
    const kidProfile = new KidProfile({
      userId: newUser._id,
      username: pendingData.childName,
      age: pendingData.childAge,
      gender: pendingData.gender,
      avatar: pendingData.gender === "boy" ? "#3B82F6" : pendingData.gender === "girl" ? "#EC4899" : "#8B5CF6",
      unlockedProducts: [],
      progress: {},
      // ✅ Auto-activate Ambassador Program
      ambassador: {
        isAmbassador: true,
        status: "profile_created",
        swagoMoney: 50, // Initial reward
        totalEarnings: 50,
        currentStep: 1,
        badges: [{ name: "Swago Saviour", awardedAt: new Date() }],
        joinedAt: new Date(),
        entryChallenge: {
          submitted: false,
          status: "not_submitted",
        },
        brainGym: {
          completed: false,
        },
      },
    });

    await kidProfile.save();

    console.log(`✅ Ambassador kid profile created: ${pendingData.childName} with 50 Swago Money`);

    // Clean up pending registration
    global.ambassadorPendingRegistrations?.delete(normalizedEmail);

    // Create JWT session
    const token = await new SignJWT({ email: normalizedEmail })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Welcome to the Swagoverse!",
      user: {
        _id: newUser._id,
        email: newUser.email,
        phone: newUser.phone,
        name: newUser.name,
        authMethod: newUser.authMethod,
      },
      kidProfile: {
        _id: kidProfile._id,
        name: kidProfile.username,
        swagoMoney: 50,
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

    return response;
  } catch (error) {
    console.error("❌ Ambassador OTP verification error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
