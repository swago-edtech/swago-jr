// apps/web/src/app/api/quests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, Quest, User } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getLoginSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // ✅ Find user from session directly
        const user = session.phone
            ? await User.findOne({ phone: session.phone })
            : await User.findOne({ email: session.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // ✅ Extract product IDs from user's lottery tickets
        const productIds = (user.lotteryTickets || []).map((ticket: any) => ticket.productId).filter(Boolean);

        // Fetch active quests for these products
        const quests = await Quest.find({
            productId: { $in: productIds },
            isActive: true
        }).populate("productId", "name");

        return NextResponse.json({ success: true, quests });
    } catch (error: any) {
        console.error("GET quests error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
