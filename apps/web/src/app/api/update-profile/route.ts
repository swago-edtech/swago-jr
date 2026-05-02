import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.isDemo) {
      return NextResponse.json(
        { error: "Demo users cannot update profile" },
        { status: 403 }
      );
    }

    const { name, email, address, age, dob, gender, grade, avatar, completeProfile } = await request.json();

    await connectDB();

    const query = session.phone ? { phone: session.phone } : { email: session.email };
    
    // First find the user to check if they've already claimed the reward
    const currentUser = await User.findOne(query);
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(address !== undefined && { address }),
      ...(age !== undefined && { age }),
      ...(dob !== undefined && { dob: new Date(dob) }),
      ...(gender !== undefined && { gender }),
      ...(grade !== undefined && { grade }),
      ...(avatar !== undefined && { avatar }),
    };

    let rewardAwarded = false;

    // Handle profile completion reward
    if (completeProfile && !currentUser.ambassador?.profileSetupRewardClaimed) {
      if (!updateData.ambassador) updateData.ambassador = currentUser.ambassador || {};
      
      updateData.ambassador.profileSetupRewardClaimed = true;
      updateData.ambassador.swagoMoney = (currentUser.ambassador?.swagoMoney || 0) + 5;
      updateData.ambassador.totalEarnings = (currentUser.ambassador?.totalEarnings || 0) + 5;
      updateData.swagoMoney = (currentUser.swagoMoney || 0) + 5;
      
      // Initialize ambassador structure if it doesn't exist
      if (!currentUser.ambassador?.isAmbassador) {
        updateData.ambassador.isAmbassador = true;
        updateData.ambassador.status = "profile_created";
        updateData.ambassador.currentStep = 2;
        updateData.ambassador.joinedAt = new Date();
        updateData.ambassador.badges = [{ name: "Swago Saviour", awardedAt: new Date() }];
        updateData.ambassador.entryChallenge = { submitted: false, status: "not_submitted" };
        updateData.ambassador.brainGym = { completed: false };
      }
      
      rewardAwarded = true;
    }

    const user = await User.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      message: rewardAwarded ? "Profile completed! You earned 5 Swago Money! 🎉" : "Profile updated successfully",
      user,
      rewardAwarded,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}