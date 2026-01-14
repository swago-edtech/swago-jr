import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryCodeBatch } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending | downloaded | sent_for_printing | printed
    const productId = searchParams.get("productId");
    const shortForm = searchParams.get("shortForm");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // 3. Build filter query
    const filter: any = {};
    
    if (status && ["pending", "downloaded", "sent_for_printing", "printed"].includes(status)) {
      filter.status = status;
    }
    
    if (productId) {
      filter.productId = productId;
    }
    
    if (shortForm) {
      filter.shortForm = shortForm.toUpperCase();
    }

    // 4. Connect to DB
    await connectDB();

    // 5. Get total count for pagination
    const totalBatches = await LotteryCodeBatch.countDocuments(filter);

    // 6. Fetch batches with pagination
    const batches = await LotteryCodeBatch.find(filter)
      .sort({ generatedAt: -1 }) // Most recent first
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("productId", "name") // Populate product name
      .lean();

    // 7. Calculate summary stats
    const stats = await LotteryCodeBatch.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalCodes: { $sum: "$quantity" },
        },
      },
    ]);

    const summary = {
      total: totalBatches,
      pending: 0,
      downloaded: 0,
      sent_for_printing: 0,
      printed: 0,
      totalCodes: 0,
    };

    stats.forEach((stat) => {
      if (stat._id === "pending") summary.pending = stat.count;
      if (stat._id === "downloaded") summary.downloaded = stat.count;
      if (stat._id === "sent_for_printing") summary.sent_for_printing = stat.count;
      if (stat._id === "printed") summary.printed = stat.count;
      summary.totalCodes += stat.totalCodes;
    });

    // 8. Return response
    return NextResponse.json({
      success: true,
      batches: JSON.parse(JSON.stringify(batches)),
      pagination: {
        page,
        limit,
        total: totalBatches,
        totalPages: Math.ceil(totalBatches / limit),
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching lottery batches:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}
