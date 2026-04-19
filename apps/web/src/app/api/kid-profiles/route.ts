// apps/web/src/app/api/kid-profiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";


// GET - List all kid profiles for the logged-in parent
export async function GET() {
  try {
    const session = await getLoginSession();


    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // For demo users, return empty profiles
    if (session.isDemo) {
      return NextResponse.json({ profiles: [] });
    }


    await connectDB();


    // Get user by phone OR email based on session
    let user;
    if (session.email) {
      console.log("🔍 Finding user by email:", session.email);
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      console.log("🔍 Finding user by phone:", session.phone);
      user = await User.findOne({ phone: session.phone });
    }


    if (!user) {
      console.error("❌ User not found for session:", session);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    console.log("✅ User found:", user._id);


    const profiles = await KidProfile.find({ userId: user._id })
      .select("-__v")
      .sort({ createdAt: -1 });


    console.log(`📋 Found ${profiles.length} kid profile(s)`);


    // Transform to match frontend expectations
    const transformedProfiles = profiles.map(profile => ({
      _id: profile._id,
      name: profile.username,
      age: profile.age,
      dob: profile.dob,
      grade: profile.grade,
      avatarColor: profile.avatar,
      gender: profile.gender,
      ambassador: profile.ambassador,
      lotteryTickets: profile.lotteryTickets || [],
      createdAt: profile.createdAt,
    }));


    return NextResponse.json({ profiles: transformedProfiles });
  } catch (error) {
    console.error("GET kid profiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}


// POST - Create a new kid profile
export async function POST(request: NextRequest) {
  try {
    const session = await getLoginSession();


    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Demo users can't create profiles
    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot create profiles. Please sign in with a real account." },
        { status: 403 }
      );
    }


    const { name, age, dob, avatarColor, grade, gender, city } = await request.json();
    console.log("📩 Creating kid profile:", { name, age, dob, avatarColor, grade, gender, city });


    // Validation
    if (!name || !age || !dob || !avatarColor) {
      return NextResponse.json(
        { error: "Name, age, date of birth, and avatar are required" },
        { status: 400 }
      );
    }


    if (age < 3 || age > 18) {
      return NextResponse.json(
        { error: "Age must be between 3 and 18" },
        { status: 400 }
      );
    }


    if (gender && !["boy", "girl", "other"].includes(gender)) {
      return NextResponse.json(
        { error: "Gender must be 'boy', 'girl', or 'other'" },
        { status: 400 }
      );
    }


    await connectDB();


    // Get user by phone OR email based on session
    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }


    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Update user's city/address if provided
    if (city && city.trim()) {
      user.address = city.trim();
      await user.save();
      console.log("📍 Updated user city:", city.trim());
    }

    // Check if parent already has 2 profiles
    const existingCount = await KidProfile.countDocuments({ userId: user._id });
    if (existingCount >= 2) {
      return NextResponse.json(
        { error: "Maximum of 2 kid profiles allowed per account" },
        { status: 400 }
      );
    }


    // Check if username already exists for this parent
    const existingProfile = await KidProfile.findOne({
      userId: user._id,
      username: name.trim()
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "You already have a kid profile with this name" },
        { status: 400 }
      );
    }


    // ✅ Create new profile with ambassador rewards
    const newProfile = new KidProfile({
      userId: user._id,
      username: name.trim(),
      age,
      dob: new Date(dob),
      grade: grade || undefined,
      avatar: avatarColor,
      gender: gender || "other",
      progress: {},
      unlockedProducts: [],
      ambassador: {
        isAmbassador: true,
        status: "profile_created",
        swagoMoney: 0,
        totalEarnings: 0,
        currentStep: 2,
        badges: [{ name: "Swago Saviour", awardedAt: new Date() }],
        joinedAt: new Date(),
        entryChallenge: { submitted: false, status: "not_submitted" },
        brainGym: { completed: false },
      },
    });


    await newProfile.save();
    console.log("✅ Kid profile created with ambassador rewards:", {
      username: newProfile.username,
      swagoMoney: newProfile.ambassador?.swagoMoney,
      badges: newProfile.ambassador?.badges?.map((b: { name: string }) => b.name),
    });


    // Transform response to match frontend
    const responseProfile = {
      _id: newProfile._id,
      name: newProfile.username,
      age: newProfile.age,
      grade: newProfile.grade,
      avatarColor: newProfile.avatar,
      gender: newProfile.gender,
      createdAt: newProfile.createdAt,
      ambassador: {
        swagoMoney: newProfile.ambassador?.swagoMoney,
        badges: newProfile.ambassador?.badges?.map((b: { name: string }) => b.name) || [],
        currentStep: newProfile.ambassador?.currentStep,
      },
    };


    return NextResponse.json(
      { message: "Profile created successfully", profile: responseProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST kid profile error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}