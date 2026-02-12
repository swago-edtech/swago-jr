import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryCode, KidProfile, User } from "@swago/database";
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

        // Get kid profile and parent info for each ticket
        const ticketsWithDetails = await Promise.all(
            tickets.map(async (ticket: any) => {
                const kidProfile = await KidProfile.findById(ticket.usedBy).select("username userId").lean() as { _id: any; username: string; userId: any } | null;
                let parentInfo = null;

                if (kidProfile) {
                    const parent = await User.findById(kidProfile.userId).select("name phone email").lean() as { name: string; phone: string; email: string } | null;
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
