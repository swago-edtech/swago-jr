import { NextRequest, NextResponse } from "next/server";
import { connectDB, ChannelOrderEvent } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const status = request.nextUrl.searchParams.get("status");
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(10, Number(request.nextUrl.searchParams.get("limit") || 20)));
    const q = String(request.nextUrl.searchParams.get("q") || "").trim().slice(0, 80);
    const filter: Record<string, unknown> = {};
    if (q) {
      // Search by marketplace order id (or subject) across all statuses
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ externalOrderId: rx }, { subject: rx }];
    } else if (status === "recheck") {
      // Applied multi-item orders ("2 items sold" or more) that the old parser may have cut only partly
      filter.status = "applied";
      filter.eventType = { $ne: "cancel" };
      filter.$or = [
        { subject: { $regex: "([2-9]|\\d{2,})\\s+items?\\s+sold", $options: "i" } },
        { "extracted.expectedItemCount": { $gt: 1 } },
      ];
    } else if (status && status !== "all") {
      filter.status = status;
    }

    const [events, total, statusGroups] = await Promise.all([
      ChannelOrderEvent.find(filter)
        .sort({ receivedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChannelOrderEvent.countDocuments(filter),
      ChannelOrderEvent.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of statusGroups) {
      if (row._id) statusCounts[row._id] = row.count;
    }

    return NextResponse.json({
      success: true,
      events,
      statusCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error: any) {
    const statusCode = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status: statusCode });
  }
}
