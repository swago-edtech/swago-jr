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

    // Get user ID from phone
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profiles = await KidProfile.find({ userId: user._id })
      .select("-__v")
      .sort({ createdAt: -1 });

    // Transform to match frontend expectations
    const transformedProfiles = profiles.map(profile => ({
      _id: profile._id,
      name: profile.username,
      age: profile.age,
      grade: profile.grade,
      avatarColor: profile.avatar, // Will store color hex or emoji
      unlockedProducts: profile.unlockedProducts.map((p: { productId: string }) => p.productId),
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

    const { name, age, avatarColor, grade } = await request.json();

    // Validation
    if (!name || !age || !avatarColor) {
      return NextResponse.json(
        { error: "Name, age, and avatar are required" },
        { status: 400 }
      );
    }

    if (age < 3 || age > 18) {
      return NextResponse.json(
        { error: "Age must be between 3 and 18" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user ID from phone
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Create new profile
    const newProfile = new KidProfile({
      userId: user._id,
      username: name.trim(),
      age,
      grade: grade || undefined,
      avatar: avatarColor, // Store the color or emoji
      unlockedProducts: [],
      progress: {},
    });

    await newProfile.save();

    // Transform response to match frontend
    const responseProfile = {
      _id: newProfile._id,
      name: newProfile.username,
      age: newProfile.age,
      grade: newProfile.grade,
      avatarColor: newProfile.avatar,
      unlockedProducts: [],
      createdAt: newProfile.createdAt,
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