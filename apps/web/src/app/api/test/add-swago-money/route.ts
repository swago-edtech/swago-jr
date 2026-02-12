import { NextRequest, NextResponse } from "next/server";
import { connectDB, KidProfile, User } from "@swago/database";

export async function POST(request: NextRequest) {
    try {
        // Only allow in development or with a secret key
        // For now, keeping it simple as a test endpoint

        const { identifier, amount, kidName } = await request.json();

        if (!identifier || amount === undefined) {
            return NextResponse.json(
                { error: "Identifier (email/phone) and amount are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }],
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find kid profiles for this user
        let query: any = { userId: user._id };
        if (kidName) {
            query.name = new RegExp(`^${kidName}$`, "i");
        }

        const profiles = await KidProfile.find(query);

        if (profiles.length === 0) {
            return NextResponse.json(
                { error: "No kid profiles found for this user" },
                { status: 404 }
            );
        }

        // Add money to the selected or first profile
        const profile = profiles[0];

        if (!profile.ambassador) {
            profile.ambassador = {
                isAmbassador: false,
                swagoMoney: 0,
                totalEarnings: 0,
                badges: [],
                currentStep: 1,
                status: "not_started"
            };
        }

        profile.ambassador.swagoMoney += Number(amount);
        profile.ambassador.totalEarnings += Number(amount);

        // Use the helper to check for badges
        if (typeof profile.checkAndAwardAmbassadorBadge === 'function') {
            profile.checkAndAwardAmbassadorBadge();
        } else {
            // Fallback if the method isn't available on the instance (rare but happens with some mongoose setups)
            if (profile.ambassador.swagoMoney >= 200) {
                const hasBadge = profile.ambassador.badges.some((b: any) => b.name === "Brand Ambassador");
                if (!hasBadge) {
                    profile.ambassador.badges.push({
                        name: "Brand Ambassador",
                        awardedAt: new Date(),
                    });
                    profile.ambassador.currentStep = 4;
                    profile.ambassador.status = "brand_ambassador";
                }
            }
        }

        await profile.save();

        return NextResponse.json({
            success: true,
            message: `Added ${amount} SD to ${profile.username || profile.name || 'Kid'}'s profile.`,
            newBalance: profile.ambassador.swagoMoney,
            totalUserBalance: profiles.reduce((sum, p) => sum + (p.ambassador?.swagoMoney || 0), 0),
        });
    } catch (error: any) {
        console.error("❌ Test Add Swago Money Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
