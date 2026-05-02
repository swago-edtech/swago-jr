import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryCode, User } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Get all used tickets
        const tickets = await LotteryCode.find({ isUsed: true })
            .sort({ usedAt: -1 })
            .lean();

        // ✅ Get user info for each ticket (usedBy now points to User)
        const ticketsWithDetails = await Promise.all(
            tickets.map(async (ticket: any) => {
                const user = await User.findById(ticket.usedBy).select("name phone email").lean() as { _id: any; name: string; phone: string; email: string } | null;

                return {
                    _id: ticket._id,
                    code: ticket.code,
                    productName: ticket.productName,
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
            tickets: ticketsWithDetails,
        });
    } catch (error) {
        console.error("Error fetching lottery tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch lottery tickets" },
            { status: 500 }
        );
    }
}
