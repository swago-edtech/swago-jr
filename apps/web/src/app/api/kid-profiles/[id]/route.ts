// apps/web/src/app/api/kid-profiles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Define type for update data
interface UpdateData {
  username?: string;
  age?: number;
  avatar?: string;
  grade?: string | null;
  pin?: string | null;
  pinHint?: string | null;
  pinAttempts?: number;
  lockedUntil?: Date | null;
}

// GET - Get a single kid profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    const { id } = await params;

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

    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // IMPORTANT: Don't use .select("-pin") here - we need to check if PIN exists
    const profile = await KidProfile.findOne({
      _id: id,
      userId: user._id,
    }); // Fetch WITH pin field so we can check if it exists

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Transform to match frontend expectations
    // Check if PIN exists but don't send the actual hash
    const transformedProfile = {
      _id: profile._id,
      name: profile.username,
      age: profile.age,
      grade: profile.grade,
      avatarColor: profile.avatar,
      hasPin: !!profile.pin,  // This will now work correctly
      pinHint: profile.pinHint || "",
      isLocked: profile.lockedUntil ? profile.lockedUntil > new Date() : false,
      unlockedProducts: profile.unlockedProducts.map((p: { productId: string }) => p.productId),
      createdAt: profile.createdAt,
    };
    // Note: We don't include the actual pin hash in the response

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
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot edit profiles" },
        { status: 403 }
      );
    }

    const { name, age, avatarColor, grade, pin, pinHint, removePin } = await request.json();

    // Validation
    if (age && (age < 3 || age > 18)) {
      return NextResponse.json(
        { error: "Age must be between 3 and 18" },
        { status: 400 }
      );
    }

    // Validate PIN if provided
    if (pin && !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits" },
        { status: 400 }
      );
    }

    await connectDB();

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

    // Prepare update object with proper typing
    const updateData: UpdateData = {};
    if (name) updateData.username = name.trim();
    if (age) updateData.age = age;
    if (avatarColor) updateData.avatar = avatarColor;
    if (grade !== undefined) updateData.grade = grade || null;
    
    // Handle PIN updates
    if (removePin) {
      updateData.pin = null;
      updateData.pinHint = null;
      updateData.pinAttempts = 0;
      updateData.lockedUntil = null;
    } else if (pin) {
      const salt = await bcrypt.genSalt(10);
      updateData.pin = await bcrypt.hash(pin, salt);
      updateData.pinHint = pinHint || null;
      updateData.pinAttempts = 0;
      updateData.lockedUntil = null;
    } else if (pinHint !== undefined) {
      updateData.pinHint = pinHint;
    }

    // Update the profile
    const updatedProfile = await KidProfile.findOneAndUpdate(
      { _id: id, userId: user._id },
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Transform to match frontend expectations
    const transformedProfile = {
      _id: updatedProfile._id,
      name: updatedProfile.username,
      age: updatedProfile.age,
      grade: updatedProfile.grade,
      avatarColor: updatedProfile.avatar,
      hasPin: !!updatedProfile.pin,  // This will now reflect the updated state
      pinHint: updatedProfile.pinHint || "",
      isLocked: updatedProfile.lockedUntil ? updatedProfile.lockedUntil > new Date() : false,
      unlockedProducts: updatedProfile.unlockedProducts.map((p: { productId: string }) => p.productId),
      createdAt: updatedProfile.createdAt,
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
    const { id } = await params;

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