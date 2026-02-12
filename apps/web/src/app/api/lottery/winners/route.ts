// apps/web/src/app/api/lottery/winners/route.ts

import { NextResponse } from "next/server";
import { connectDB, LotteryDraw } from "@swago/database";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // Get the most recent 5 completed draws with winners
        const draws = await LotteryDraw.find({
            status: "drawn",
            "winner.announcedAt": { $lte: new Date() } // Only show if announcement time has passed
        })
            .sort({ drawDate: -1 })
            .limit(5)
            .lean();

        const winners = draws.map((draw: any) => ({
            name: draw.winner.kidName,
            city: "Winner Box", // You might want to store city in draw.winner later
            prize: "Free Blind Bag",
            avatar: "/images/kid_boy1.png", // Default avatar for now
            announcedAt: draw.winner.announcedAt,
            ticketCode: draw.winner.ticketCode,
        }));

        return NextResponse.json({ success: true, winners });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
