import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

// GET - Get a single kid profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    const { id } = await params; // Await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    await connectDB();

    // Get user ID from phone
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await KidProfile.findOne({
      _id: id,
      userId: user._id,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Transform to match frontend expectations
    const transformedProfile = {
      _id: profile._id,
      name: profile.username,
      age: profile.age,
      grade: profile.grade,
      avatarColor: profile.avatar,
      unlockedProducts: profile.unlockedProducts.map((p: { productId: string }) => p.productId),
      createdAt: profile.createdAt,
    };

    return NextResponse.json({ profile: transformedProfile });
  } catch (error) {
    console.error("GET kid profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update a kid profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    const { id } = await params; // Await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot edit profiles" },
        { status: 403 }
      );
    }

    const { name, age, avatarColor, grade } = await request.json();

    // Validation
    if (age && (age < 3 || age > 18)) {
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

    // If changing username, check it doesn't already exist
    if (name) {
      const existingProfile = await KidProfile.findOne({ 
        userId: user._id, 
        username: name.trim(),
        _id: { $ne: id }
      });
      
      if (existingProfile) {
        return NextResponse.json(
          { error: "You already have another kid profile with this name" },
          { status: 400 }
        );
      }
    }

    const profile = await KidProfile.findOneAndUpdate(
      { _id: id, userId: user._id },
      {
        ...(name && { username: name.trim() }),
        ...(age && { age }),
        ...(avatarColor && { avatar: avatarColor }),
        ...(grade && { grade }),
      },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Transform response
    const transformedProfile = {
      _id: profile._id,
      name: profile.username,
      age: profile.age,
      grade: profile.grade,
      avatarColor: profile.avatar,
      unlockedProducts: profile.unlockedProducts.map((p: { productId: string }) => p.productId),
      createdAt: profile.createdAt,
    };

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: transformedProfile,
    });
  } catch (error) {
    console.error("PATCH kid profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a kid profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    const { id } = await params; // Await params

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot delete profiles" },
        { status: 403 }
      );
    }

    await connectDB();

    // Get user ID from phone
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await KidProfile.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("DELETE kid profile error:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}