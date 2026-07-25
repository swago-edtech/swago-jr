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

        const searchParams = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
        const search = searchParams.get("search")?.trim() || "";

        const filter: any = { isUsed: true };

        if (search) {
            const searchRegex = new RegExp(search, "i");

            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { phone: searchRegex },
                    { email: searchRegex },
                ],
            })
                .select("_id")
                .lean();

            const matchingUserIds = matchingUsers.map((u: any) => u._id);

            filter.$or = [
                { code: searchRegex },
                { productName: searchRegex },
                { shortForm: searchRegex },
                ...(matchingUserIds.length > 0 ? [{ usedBy: { $in: matchingUserIds } }] : []),
            ];
        }

        const totalCount = await LotteryCode.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;

        const tickets = await LotteryCode.find(filter)
            .sort({ usedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const userIds = Array.from(
            new Set(tickets.map((t: any) => t.usedBy).filter(Boolean))
        );

        const users = userIds.length > 0
            ? await User.find({ _id: { $in: userIds } })
                .select("name phone email")
                .lean()
            : [];

        const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

        const ticketsWithDetails = tickets.map((ticket: any) => {
            const user = ticket.usedBy ? userMap.get(ticket.usedBy.toString()) : null;

            return {
                _id: ticket._id,
                code: ticket.code,
                productName: ticket.productName,
                shortForm: ticket.shortForm,
                redeemedAt: ticket.usedAt,
                kidProfile: user
                    ? {
                        _id: user._id,
                        name: user.name || "Unknown",
                    }
                    : null,
                parent: user
                    ? {
                        name: user.name,
                        phone: user.phone,
                        email: user.email,
                    }
                    : null,
            };
        });

        return NextResponse.json({
            success: true,
            tickets: ticketsWithDetails,
            pagination: {
                currentPage: page,
                totalPages: totalPages || 1,
                totalCount,
                limit,
            },
        });
    } catch (error) {
        console.error("Error fetching lottery tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch lottery tickets" },
            { status: 500 }
        );
    }
}
