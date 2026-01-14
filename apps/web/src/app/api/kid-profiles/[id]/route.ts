// apps/web/src/app/api/kid-profiles/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

// ✅ Type definitions
interface UnlockedProduct {
  productId: string;
  unlockedAt?: Date;
}

interface ProfileUpdates {
  username?: string;
  age?: number;
  grade?: string;
  avatar?: string;
  gender?: string;
}

// GET - Fetch single kid profile with ambassador data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Demo users get empty data
    if (session.isDemo) {
      return NextResponse.json({ 
        profile: {
          _id: id,
          name: "Demo Kid",
          age: 8,
          avatarColor: "#8B5CF6",
          unlockedProducts: [],
          ambassador: {
            isAmbassador: false,
            status: "not_started",
            swagoMoney: 0,
            badges: [],
            currentStep: 1,
            entryChallenge: {
              submitted: false,
              status: "not_submitted",
            },
            brainGym: {
              completed: false,
            },
            totalEarnings: 0,
          },
        }
      });
    }

    await connectDB();

    // ✅ FIX: Get user by phone OR email based on session
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

    const profile = await KidProfile.findOne({
      _id: id,
      userId: user._id,
    });

    if (!profile) {
      console.error("❌ Profile not found or unauthorized. ID:", id, "User ID:", user._id);
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("✅ Profile found:", profile._id);

    // Transform ambassador data for frontend
    const ambassadorData = profile.ambassador || {
      isAmbassador: false,
      status: "not_started",
      swagoMoney: 0,
      badges: [],
      currentStep: 1,
      entryChallenge: {
        submitted: false,
        status: "not_submitted",
      },
      brainGym: {
        completed: false,
      },
      totalEarnings: 0,
    };

    // Build response
    const responseProfile = {
      _id: profile._id,
      name: profile.username,
      age: profile.age,
      grade: profile.grade,
      avatarColor: profile.avatar,
      gender: profile.gender,
      hasPin: !!profile.pin,
      isLocked: profile.lockedUntil ? profile.lockedUntil > new Date() : false,
      unlockedProducts: profile.unlockedProducts.map((p: UnlockedProduct) => p.productId),
      lastActiveAt: profile.lastActiveAt,
      // Ambassador data
      ambassador: {
        isAmbassador: ambassadorData.isAmbassador || false,
        status: ambassadorData.status || "not_started",
        swagoMoney: ambassadorData.swagoMoney || 0,
        badges: ambassadorData.badges || [],
        currentStep: ambassadorData.currentStep || 1,
        entryChallenge: {
          submitted: ambassadorData.entryChallenge?.submitted || false,
          reelUrl: ambassadorData.entryChallenge?.reelUrl,
          status: ambassadorData.entryChallenge?.status || "not_submitted",
          submittedAt: ambassadorData.entryChallenge?.submittedAt,
          reviewedAt: ambassadorData.entryChallenge?.reviewedAt,
        },
        brainGym: {
          completed: ambassadorData.brainGym?.completed || false,
          completedAt: ambassadorData.brainGym?.completedAt,
        },
        totalEarnings: ambassadorData.totalEarnings || 0,
        joinedAt: ambassadorData.joinedAt,
      },
      createdAt: profile.createdAt,
    };

    return NextResponse.json({ 
      success: true,
      profile: responseProfile 
    });
  } catch (error) {
    console.error("GET kid profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update kid profile (for parents)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Only allow specific fields to be updated
    const allowedUpdates = ['username', 'age', 'grade', 'avatar', 'gender'] as const;
    const filteredUpdates: Partial<ProfileUpdates> = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ FIX: Get user by phone OR email based on session
    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await KidProfile.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: filteredUpdates },
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
      message: "Profile updated successfully",
      profile: {
        _id: profile._id,
        name: profile.username,
        age: profile.age,
        grade: profile.grade,
        avatarColor: profile.avatar,
        gender: profile.gender,
      },
    });
  } catch (error) {
    console.error("PATCH kid profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// DELETE - Delete kid profile (for parents)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();

    if (!session || session.isDemo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    // ✅ FIX: Get user by phone OR email based on session
    let user;
    if (session.email) {
      user = await User.findOne({ email: session.email });
    } else if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await KidProfile.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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
