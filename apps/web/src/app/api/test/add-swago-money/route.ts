import { NextRequest, NextResponse } from "next/server";
import { connectDB, User } from "@swago/database";

export async function POST(request: NextRequest) {
    try {
        const { identifier, amount } = await request.json();

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

        // ✅ Add money directly to user's ambassador swagoMoney
        if (!user.ambassador) {
            user.ambassador = {
                isAmbassador: false,
                swagoMoney: 0,
                totalEarnings: 0,
                badges: [],
                currentStep: 1,
                status: "not_started"
            };
        }

        user.ambassador.swagoMoney += Number(amount);
        user.ambassador.totalEarnings += Number(amount);

        // Check for badges
        if (typeof user.checkAndAwardAmbassadorBadge === 'function') {
            user.checkAndAwardAmbassadorBadge();
        } else {
            if (user.ambassador.swagoMoney >= 200) {
                const hasBadge = user.ambassador.badges.some((b: any) => b.name === "Brand Ambassador");
                if (!hasBadge) {
                    user.ambassador.badges.push({
                        name: "Brand Ambassador",
                        awardedAt: new Date(),
                    });
                    user.ambassador.currentStep = 4;
                    user.ambassador.status = "brand_ambassador";
                }
            }
        }

        await user.save();

        return NextResponse.json({
            success: true,
            message: `Added ${amount} SD to ${user.name || 'User'}'s account.`,
            newBalance: user.ambassador.swagoMoney,
        });
    } catch (error: any) {
        console.error("❌ Test Add Swago Money Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
