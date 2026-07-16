// apps/admin/app/api/lottery-draws/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryDraw, LotteryCode, User } from "@swago/database";
import mongoose from "mongoose";
import { sendNotificationEmail } from "../../../../../web/src/lib/msg91-email";

interface LotteryTicket {
    _id: mongoose.Types.ObjectId;
    code: string;
    productName: string;
    shortForm: string;
    usedBy: mongoose.Types.ObjectId;
    usedAt: Date;
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
        }).populate("productId", "name")
            .select("code productName shortForm usedBy usedAt productId")
            .lean() as any[];

        // ✅ Get user info for each ticket (usedBy now points to User)
        const ticketsWithDetails = await Promise.all(
            eligibleTickets.map(async (ticket) => {
                const user = await User.findById(ticket.usedBy).select("name phone email").lean() as { _id: any; name: string; phone: string; email: string } | null;

                return {
                    _id: ticket._id,
                    code: ticket.code,
                    productName: ticket.productName || (ticket.productId as any)?.name || "Unknown Product",
                    shortForm: ticket.shortForm,
                    redeemedAt: ticket.usedAt,
                    // Keep "kidProfile" key for backward compat with display pages
                    kidProfile: user ? {
                        _id: user._id,
                        name: user.name || 'Unknown',
                    } : null,
                    parent: user ? {
                        name: user.name,
                        phone: user.phone,
                        email: user.email,
                    } : null,
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

// POST - Select winner(s) and credit Swago money
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { ticketCodes, rewardAmount, adminEmail } = await request.json();

        if (!ticketCodes || !Array.isArray(ticketCodes) || ticketCodes.length === 0) {
            return NextResponse.json(
                { error: "Ticket codes array is required" },
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

        const amount = Number(rewardAmount) || 0;
        const newWinners = [];

        for (const ticketCode of ticketCodes) {
            // Find the ticket
            const ticket = await LotteryCode.findOne({
                code: ticketCode,
                isUsed: true,
                usedAt: { $gte: draw.startDate, $lt: draw.endDate },
            });

            if (!ticket) {
                console.log(`Ticket ${ticketCode} not found in this draw period`);
                continue;
            }

            // Get user directly (usedBy references User)
            const user = await User.findById(ticket.usedBy);
            if (!user) {
                console.log(`User not found for ticket ${ticketCode}`);
                continue;
            }

            // Credit wallet
            if (amount > 0) {
                await user.awardSwagoMoney(amount, "Lottery Draw Winner");
                
                // Send email notification for Lottery Win
                if (user.email) {
                    const emailHtml = `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #eaeaea;">
                            <h2 style="color: #1e3a8a; text-align: center;">Congratulations, ${user.name || 'Swago Fam'}! 🏆</h2>
                            <p style="color: #333; font-size: 16px; line-height: 1.5;">
                                Amazing news! You have been selected as a winner in this week's Swago Jr. Lottery Draw!
                            </p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Prize Credited:</strong> $${amount} Swago Money</p>
                                <p style="margin: 5px 0 0; color: #4b5563; font-size: 14px;"><strong>Winning Ticket:</strong> ${ticket.code}</p>
                            </div>
                            <p style="color: #333; font-size: 16px; line-height: 1.5;">
                                Your reward has already been deposited directly into your account and is ready to use on your next purchase!
                            </p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://swagojr.com" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                    Shop Now
                                </a>
                            </div>
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                                If you have any questions, please reply to this email.<br/>
                                © ${new Date().getFullYear()} Swago Jr. All rights reserved.
                            </p>
                        </div>
                    `;

                    await sendNotificationEmail(
                        user.email,
                        user.name || '',
                        '🏆 You won the Swago Jr. Lottery!',
                        emailHtml
                    );
                }
            }

            const winnerRecord = {
                kidProfileId: user._id,
                kidName: user.name || 'Unknown',
                ticketCode: ticket.code,
                ticketProductName: ticket.productName,
                parentPhone: user.phone || "",
                parentEmail: user.email || "",
                announcedAt: new Date(),
                announcedBy: adminEmail || "admin",
                rewardAmount: amount,
            };

            newWinners.push(winnerRecord);
        }

        if (newWinners.length === 0) {
            return NextResponse.json(
                { error: "No valid tickets found to process" },
                { status: 400 }
            );
        }

        if (!draw.winners) {
            draw.winners = [];
        }
        
        draw.winners.push(...newWinners);

        // Update legacy winner for backward compat if empty
        if (!draw.winner || !draw.winner.kidName) {
            draw.winner = newWinners[0];
        }

        draw.status = "drawn";
        await draw.save();

        console.log(`🎉 Lottery winners selected: ${newWinners.length} winners credited with $${amount}`);

        return NextResponse.json({
            success: true,
            message: `Successfully selected and credited ${newWinners.length} winner(s)!`,
            winners: draw.winners,
        });
    } catch (error) {
        console.error("Select winner error:", error);
        return NextResponse.json(
            { error: "Failed to select winners" },
            { status: 500 }
        );
    }
}
