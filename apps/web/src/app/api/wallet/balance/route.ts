import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, User, KidProfile } from "@swago/database";

export async function GET() {
    try {
        const session = await getLoginSession();

        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // Demo user
        if (session.isDemo) {
            return NextResponse.json({ success: true, totalSwagoMoney: 0, profiles: [] });
        }

        await connectDB();

        let user;
        if (session.email) {
            user = await User.findOne({ email: session.email });
        } else if (session.phone) {
            user = await User.findOne({ phone: session.phone });
        }

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const profiles = await KidProfile.find({ userId: user._id }).select("username ambassador.swagoMoney");

        let totalSwagoMoney = 0;
        const profilesBalances = profiles.map(p => {
            const balance = p.ambassador?.swagoMoney || 0;
            totalSwagoMoney += balance;
            return {
                _id: p._id,
                name: p.username,
                balance
            };
        });

        return NextResponse.json({
            success: true,
            totalSwagoMoney,
            profiles: profilesBalances
        });

    } catch (error) {
        console.error("GET wallet balance error:", error);
        return NextResponse.json(
            { error: "Failed to fetch wallet balance" },
            { status: 500 }
        );
    }
}
