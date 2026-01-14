// apps/web/src/app/api/ambassador/complete-registration/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { connectDB, User, KidProfile } from "@swago/database";
import { z } from "zod";
import { formatPhoneForStorage } from "@/lib/msg91";

const registrationSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  parentName: z.string().min(2, "Parent name is required"),
  parentEmail: z.string().email("Invalid email address"),
  parentPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  city: z.string().min(2, "City is required"),
  childName: z.string().min(2, "Child name is required"),
  childAge: z.number().min(7).max(14, "Child must be between 7-14 years old"),
  gender: z.enum(["boy", "girl", "other"]),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📥 Registration request received:", {
      email: body.parentEmail,
      city: body.city,
      childName: body.childName,
      childAge: body.childAge,
      gender: body.gender,
    });

    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      console.error("❌ Validation failed:", validation.error.issues);
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      accessToken,
      parentName,
      parentEmail,
      parentPhone,
      city,
      childName,
      childAge,
      gender,
    } = validation.data;

    console.log(`🚀 Ambassador registration starting for: ${parentEmail}`);

    // Verify access token with MSG91
    console.log("🔐 Verifying access token...");
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

    const normalizedEmail = parentEmail.toLowerCase().trim();
    const formattedPhone = formatPhoneForStorage(parentPhone);

    // Check if user already exists
    console.log("🔍 Checking if user exists...");
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.error("❌ User already exists:", normalizedEmail);
      return NextResponse.json(
        { error: "An account with this email already exists. Please login instead." },
        { status: 400 }
      );
    }

    // Create parent user account
    console.log("👤 Creating parent account...");
    const newUser = await User.create({
      email: normalizedEmail,
      phone: formattedPhone,
      name: parentName.trim(),
      address: city.trim(),  // ✅ ADDED: Save city to address field
      authMethod: "email",
      cart: [],
      wishlist: [],
      orders: [],
    });

    console.log(`✅ Parent account created successfully:`, {
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      address: newUser.address,  // ✅ Log the saved address
    });

  // ✅ UPDATED: Determine avatar image based on gender
const avatarColor = 
  gender === "boy" ? "/images/kid_boy1.png" :
  gender === "girl" ? "/images/kid_girl1.png" :
  "/images/swoo.png"; // Default for "other"


    // Create kid profile with ambassador program auto-activated
    console.log("🧒 Creating kid profile...");
    console.log("Kid profile data:", {
      userId: newUser._id,
      username: childName.trim(),
      age: childAge,
      gender: gender,
      avatar: avatarColor,
    });

    const kidProfile = new KidProfile({
      userId: newUser._id,
      username: childName.trim(),
      age: childAge,
      gender: gender,
      avatar: avatarColor,
      unlockedProducts: [],
      progress: {},
      // Auto-activate Ambassador Program
      ambassador: {
        isAmbassador: true,
        status: "profile_created",
        swagoMoney: 50,
        totalEarnings: 50,
        currentStep: 2,
        badges: [
          { 
            name: "Swago Saviour", 
            awardedAt: new Date() 
          }
        ],
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

    console.log(`✅ Kid profile created successfully:`, {
      _id: kidProfile._id,
      username: kidProfile.username,
      age: kidProfile.age,
      gender: kidProfile.gender,
      isAmbassador: kidProfile.ambassador?.isAmbassador,
      swagoMoney: kidProfile.ambassador?.swagoMoney,
      currentStep: kidProfile.ambassador?.currentStep,
    });

    // Create JWT session
    console.log("🔑 Creating JWT session...");
    const token = await new SignJWT({ email: normalizedEmail })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Welcome to the Swagoverse! 🎉",
      user: {
        _id: newUser._id,
        email: newUser.email,
        phone: newUser.phone,
        name: newUser.name,
        address: newUser.address,  // ✅ ADDED: Return address in response
        authMethod: newUser.authMethod,
        wishlist: [],
        orders: [],
        cart: [],
      },
      kidProfile: {
        _id: kidProfile._id,
        name: kidProfile.username,
        age: kidProfile.age,
        gender: kidProfile.gender,
        avatarColor: kidProfile.avatar,
        ambassador: {
          swagoMoney: 50,
          badges: ["Swago Saviour"],
          currentStep: 2,
        },
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

    console.log("🎉 Registration completed successfully!");
    return response;
  } catch (error) {
    console.error("❌ Ambassador registration error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
