// apps/admin/app/api/lottery-draws/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryDraw, LotteryCode, KidProfile, User } from "@swago/database";
import mongoose from "mongoose";

interface LotteryTicket {
    _id: mongoose.Types.ObjectId;
    code: string;
    productName: string;
    shortForm: string;
    usedBy: mongoose.Types.ObjectId;
    usedAt: Date;
}

interface KidProfileWithUser {
    _id: mongoose.Types.ObjectId;
    username: string;
    userId: mongoose.Types.ObjectId;
}

// GET - Get draw details with eligible tickets
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await connectDB();

        const draw = await LotteryDraw.findById(id);

        if (!draw) {
            return NextResponse.json(
                { error: "Draw not found" },
                { status: 404 }
            );
        }

        // Get eligible tickets for this draw period
        const eligibleTickets = await LotteryCode.find({
            isUsed: true,
            usedAt: { $gte: draw.startDate, $lt: draw.endDate },
        }).select("code productName shortForm usedBy usedAt").lean() as unknown as LotteryTicket[];

        // Get kid profile and parent info for each ticket
        const ticketsWithDetails = await Promise.all(
            eligibleTickets.map(async (ticket) => {
                const kidProfile = await KidProfile.findById(ticket.usedBy).select("username userId").lean() as KidProfileWithUser | null;
                let parentInfo = null;

                if (kidProfile) {
                    const parent = await User.findById(kidProfile.userId).select("name phone email").lean();
                    parentInfo = parent;
                }

                return {
                    _id: ticket._id,
                    code: ticket.code,
                    productName: ticket.productName,
                    shortForm: ticket.shortForm,
                    redeemedAt: ticket.usedAt,
                    kidProfile: kidProfile ? {
                        _id: kidProfile._id,
                        name: kidProfile.username,
                    } : null,
                    parent: parentInfo,
                };
            })
        );

        return NextResponse.json({
            success: true,
            draw,
            tickets: ticketsWithDetails,
            totalTickets: ticketsWithDetails.length,
        });
    } catch (error) {
        console.error("Get lottery draw error:", error);
        return NextResponse.json(
            { error: "Failed to fetch lottery draw" },
            { status: 500 }
        );
    }
}

// POST - Select winner (manual selection)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { ticketCode, adminEmail } = await request.json();

        if (!ticketCode) {
            return NextResponse.json(
                { error: "Ticket code is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const draw = await LotteryDraw.findById(id);

        if (!draw) {
            return NextResponse.json(
                { error: "Draw not found" },
                { status: 404 }
            );
        }

        if (draw.status === "drawn") {
            return NextResponse.json(
                { error: "Winner already selected for this draw" },
                { status: 400 }
            );
        }

        // Find the ticket
        const ticket = await LotteryCode.findOne({
            code: ticketCode,
            isUsed: true,
            usedAt: { $gte: draw.startDate, $lt: draw.endDate },
        });

        if (!ticket) {
            return NextResponse.json(
                { error: "Ticket not found in this draw period" },
                { status: 404 }
            );
        }

        // Get kid profile and parent
        const kidProfile = await KidProfile.findById(ticket.usedBy).select("username userId");
        if (!kidProfile) {
            return NextResponse.json(
                { error: "Kid profile not found" },
                { status: 404 }
            );
        }

        const parent = await User.findById(kidProfile.userId).select("name phone email");

        // Update draw with winner
        draw.winner = {
            kidProfileId: kidProfile._id,
            kidName: kidProfile.username,
            ticketCode: ticket.code,
            ticketProductName: ticket.productName,
            parentPhone: parent?.phone || "",
            parentEmail: parent?.email || "",
            announcedAt: new Date(),
            announcedBy: adminEmail || "admin",
        };
        draw.status = "drawn";

        await draw.save();

        console.log(`🎉 Lottery winner selected: ${kidProfile.username} with ticket ${ticketCode}`);

        return NextResponse.json({
            success: true,
            message: "Winner selected successfully!",
            winner: draw.winner,
        });
    } catch (error) {
        console.error("Select winner error:", error);
        return NextResponse.json(
            { error: "Failed to select winner" },
            { status: 500 }
        );
    }
}
