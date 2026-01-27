// apps/admin/app/api/lottery-draws/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryDraw, LotteryCode, KidProfile, User } from "@swago/database";

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

        const now = new Date();

        // Find the most recent Thursday 7PM IST
        const getLastThursday7PM = (from: Date): Date => {
            const d = new Date(from);
            d.setUTCHours(13, 30, 0, 0); // 7PM IST = 13:30 UTC

            while (d.getDay() !== 4 || d > from) {
                d.setDate(d.getDate() - 1);
            }
            return d;
        };

        const startDate = getLastThursday7PM(now);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        const drawDate = new Date(startDate);
        drawDate.setDate(drawDate.getDate() + 1); // Friday

        // Generate draw number
        const year = startDate.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((startDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        const drawNumber = `DRAW-${year}-W${String(week).padStart(2, '0')}`;

        // Check if already exists
        const existing = await LotteryDraw.findOne({ drawNumber });
        if (existing) {
            return NextResponse.json({
                success: true,
                message: "Draw already exists",
                draw: existing,
            });
        }

        // Count eligible tickets
        const eligibleTickets = await LotteryCode.countDocuments({
            isUsed: true,
            usedAt: { $gte: startDate, $lt: endDate },
        });

        const draw = await LotteryDraw.create({
            drawNumber,
            startDate,
            endDate,
            drawDate,
            status: "open",
            totalTickets: eligibleTickets,
        });

        return NextResponse.json({
            success: true,
            message: "Draw created successfully",
            draw,
        });
    } catch (error) {
        console.error("Create lottery draw error:", error);
        return NextResponse.json(
            { error: "Failed to create lottery draw" },
            { status: 500 }
        );
    }
}
