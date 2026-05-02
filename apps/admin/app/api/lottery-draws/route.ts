// apps/admin/app/api/lottery-draws/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryDraw, LotteryCode, User } from "@swago/database";

// GET - List all lottery draws with summary
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const url = new URL(request.url);
        const status = url.searchParams.get("status");

        // Build query
        const query: Record<string, string> = {};
        if (status) {
            query.status = status;
        }

        const draws = await LotteryDraw.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        // Get summary counts
        const summary = {
            total: await LotteryDraw.countDocuments(),
            open: await LotteryDraw.countDocuments({ status: "open" }),
            closed: await LotteryDraw.countDocuments({ status: "closed" }),
            drawn: await LotteryDraw.countDocuments({ status: "drawn" }),
        };

        return NextResponse.json({
            success: true,
            draws,
            summary,
        });
    } catch (error) {
        console.error("Get lottery draws error:", error);
        return NextResponse.json(
            { error: "Failed to fetch lottery draws" },
            { status: 500 }
        );
    }
}

// POST - Create a new draw period (usually auto-created)
export async function POST() {
    try {
        await connectDB();

        // Use the model's static helper to get or create the current draw
        // This ensures consistent logic (Wednesday 8PM cutoff)
        const draw = await (LotteryDraw as any).getCurrentOrCreateDraw();

        return NextResponse.json({
            success: true,
            message: draw.isNew ? "Draw created successfully" : "Draw already exists",
            draw,
        });
    } catch (error: any) {
        console.error("Create lottery draw error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create lottery draw" },
            { status: 500 }
        );
    }
}
