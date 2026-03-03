// apps/web/src/app/api/quests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, Quest, KidProfile } from "@swago/database";
import { getLoginSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getLoginSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const kidId = searchParams.get("kidId");

        if (!kidId) {
            return NextResponse.json({ error: "kidId is required" }, { status: 400 });
        }

        // 1. Get the kid profile to see their products
        const kid = await KidProfile.findById(kidId);
        if (!kid) {
            return NextResponse.json({ error: "Kid not found" }, { status: 404 });
        }

        // 2. Extract product IDs from lottery tickets (purchased products)
        const productIds = kid.lotteryTickets.map((ticket: any) => ticket.productId).filter(Boolean);

        // 3. Fetch active quests for these products
        // If no products, we might want to return some general quests or nothing
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
