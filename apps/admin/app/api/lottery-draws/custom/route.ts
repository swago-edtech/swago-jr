import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryDraw, LotteryCode, User } from "@swago/database";

export async function POST(request: NextRequest) {
    try {
        const { startDate, endDate, winnerCount } = await request.json();

        if (!startDate || !endDate || !winnerCount) {
            return NextResponse.json(
                { error: "startDate, endDate, and winnerCount are required" },
                { status: 400 }
            );
        }

        const count = Number(winnerCount);
        if (count < 1) {
            return NextResponse.json(
                { error: "winnerCount must be at least 1" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        await connectDB();

        // 1. Fetch eligible tickets
        const eligibleTickets = await LotteryCode.find({
            isUsed: true,
            usedAt: { $gte: start, $lte: end },
        }).lean() as any[];

        if (eligibleTickets.length === 0) {
            return NextResponse.json(
                { error: "No eligible tickets found in this date range." },
                { status: 400 }
            );
        }

        // Ensure we don't pick more winners than available unique users/tickets
        // For fairness, one user can win multiple times if they have multiple tickets, 
        // or we can restrict it to unique users. Let's stick to unique tickets like the current system.
        const actualWinnerCount = Math.min(count, eligibleTickets.length);

        // 2. Randomly select winners
        const shuffled = eligibleTickets.sort(() => 0.5 - Math.random());
        const selectedTickets = shuffled.slice(0, actualWinnerCount);

        // 3. Create Custom Draw
        const drawNumber = `DRAW-CUSTOM-${Date.now()}`;
        
        const draw = await LotteryDraw.create({
            drawNumber,
            drawType: "custom",
            startDate: start,
            endDate: end,
            drawDate: new Date(),
            status: "open", // Will be marked as 'drawn' when admin credits them via the existing detail page
            totalTickets: eligibleTickets.length,
        });

        return NextResponse.json({
            success: true,
            draw,
            selectedTicketCodes: selectedTickets.map(t => t.code),
            message: `Custom draw created! Found ${eligibleTickets.length} eligible tickets.`
        });

    } catch (error) {
        console.error("Create custom draw error:", error);
        return NextResponse.json(
            { error: "Failed to create custom draw" },
            { status: 500 }
        );
    }
}
