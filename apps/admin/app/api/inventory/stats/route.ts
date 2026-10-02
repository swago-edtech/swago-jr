import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB, InventoryItem, InventoryTransaction } from "@swago/database";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const [aggregateStats] = await InventoryItem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalStock: { $sum: "$currentStock" },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$currentStock", 0] },
                    { $lte: ["$currentStock", "$lowStockThreshold"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $lte: ["$currentStock", 0] }, 1, 0] },
          },
          belowTargetCount: {
            $sum: { $cond: [{ $lt: ["$currentStock", "$targetQuantity"] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = aggregateStats || {
      totalItems: 0,
      totalStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      belowTargetCount: 0,
    };

    const recentTransactions = await InventoryTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    stats.recentTransactions = recentTransactions;

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
