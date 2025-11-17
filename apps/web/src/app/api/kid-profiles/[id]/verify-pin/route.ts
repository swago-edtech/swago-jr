// apps/web/src/app/api/kid-profiles/[id]/verify-pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile } from "@swago/database";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json(
        { error: "PIN is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const profile = await KidProfile.findById(id);
    
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if profile is locked
    if (profile.isLocked()) {
      const lockTimeRemaining = Math.ceil(
        (profile.lockedUntil.getTime() - Date.now()) / 1000 / 60
      );
      return NextResponse.json(
        { 
          error: `Profile is locked. Try again in ${lockTimeRemaining} minutes`,
          locked: true,
          attemptsLeft: 0 
        },
        { status: 403 }
      );
    }

    // If no PIN is set, allow access
    if (!profile.pin) {
      await profile.resetAttempts();
      return NextResponse.json({ 
        success: true,
        message: "No PIN required",
        profile: {
          _id: profile._id,
          name: profile.username,
          age: profile.age,
          avatarColor: profile.avatar,
        }
      });
    }

    // Verify PIN
    const isValid = await bcrypt.compare(pin, profile.pin);
    
    if (isValid) {
      // Reset attempts on successful PIN
      await profile.resetAttempts();
      
      // Update last active
      profile.lastActiveAt = new Date();
      await profile.save();
      
      return NextResponse.json({ 
        success: true,
        profile: {
          _id: profile._id,
          name: profile.username,
          age: profile.age,
          avatarColor: profile.avatar,
        }
      });
    } else {
      // Increment failed attempts
      await profile.incrementAttempts();
      
      const attemptsLeft = Math.max(0, 5 - profile.pinAttempts);
      const showHint = profile.pinAttempts >= 3 && profile.pinHint;
      
      return NextResponse.json(
        { 
          error: "Incorrect PIN",
          attemptsLeft,
          hint: showHint ? profile.pinHint : null,
          locked: profile.isLocked()
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("PIN verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}

// Reset PIN (for parents)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getLoginSession } = await import("@/lib/auth");
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { User } = await import("@swago/database");
    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reset PIN and unlock profile
    const profile = await KidProfile.findOneAndUpdate(
      { _id: id, userId: user._id },
      { 
        pin: null,
        pinHint: null,
        pinAttempts: 0,
        lockedUntil: null
      },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "PIN removed successfully" 
    });
  } catch (error) {
    console.error("Reset PIN error:", error);
    return NextResponse.json(
      { error: "Failed to reset PIN" },
      { status: 500 }
    );
  }
}