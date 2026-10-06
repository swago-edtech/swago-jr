import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB, LotteryCode, User } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Start of an IST calendar day ("YYYY-MM-DD") as a UTC Date
function istDayStart(ymd: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    if (!m) return null;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) - IST_OFFSET_MS);
}

// Resolve a date preset into a usedAt range using Asia/Kolkata day boundaries
function resolveDateRange(range: string, from: string, to: string) {
    const istNow = new Date(Date.now() + IST_OFFSET_MS);
    const todayStart = new Date(
        Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST_OFFSET_MS
    );
    switch (range) {
        case "today":
            return { $gte: todayStart };
        case "7d":
            return { $gte: new Date(todayStart.getTime() - 6 * DAY_MS) };
        case "30d":
            return { $gte: new Date(todayStart.getTime() - 29 * DAY_MS) };
        case "month":
            return {
                $gte: new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), 1) - IST_OFFSET_MS),
            };
        case "custom": {
            const start = istDayStart(from);
            const end = istDayStart(to);
            const cond: Record<string, Date> = {};
            if (start) cond.$gte = start;
            if (end) cond.$lt = new Date(end.getTime() + DAY_MS);
            return Object.keys(cond).length ? cond : null;
        }
        default:
            return null;
    }
}

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
        const productId = searchParams.get("productId") || "";
        const contact = searchParams.get("contact") || "";
        const dateRange = resolveDateRange(
            searchParams.get("range") || "",
            searchParams.get("from") || "",
            searchParams.get("to") || ""
        );

        const filter: any = { isUsed: true };
        const and: any[] = [];

        if (productId && mongoose.isValidObjectId(productId)) {
            filter.productId = new mongoose.Types.ObjectId(productId);
        }
        if (dateRange) {
            filter.usedAt = dateRange;
        }
        if (contact === "phone" || contact === "email") {
            // Bounded by redeemers only, so this stays cheap
            const redeemerIds = await LotteryCode.distinct("usedBy", { isUsed: true });
            const withContact = await User.find({
                _id: { $in: redeemerIds },
                [contact]: { $exists: true, $nin: [null, ""] },
            }).distinct("_id");
            and.push({ usedBy: { $in: withContact } });
        }

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

            and.push({
                $or: [
                    { code: searchRegex },
                    { productName: searchRegex },
                    { shortForm: searchRegex },
                    ...(matchingUserIds.length > 0 ? [{ usedBy: { $in: matchingUserIds } }] : []),
                ],
            });
        }

        if (and.length > 0) filter.$and = and;

        const [totalCount, productGroups] = await Promise.all([
            LotteryCode.countDocuments(filter),
            // Products that actually have redeemed tickets (also yields the unfiltered total)
            LotteryCode.aggregate([
                { $match: { isUsed: true } },
                {
                    $group: {
                        _id: "$productId",
                        productName: { $first: "$productName" },
                        shortForms: { $addToSet: "$shortForm" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { productName: 1 } },
            ]),
        ]);
        const overallCount = productGroups.reduce((sum: number, p: any) => sum + p.count, 0);
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
            overallCount,
            products: productGroups.map((p: any) => ({
                _id: p._id,
                productName: p.productName,
                shortForms: p.shortForms,
                count: p.count,
            })),
        });
    } catch (error) {
        console.error("Error fetching lottery tickets:", error);
        return NextResponse.json(
            { error: "Failed to fetch lottery tickets" },
            { status: 500 }
        );
    }
}
