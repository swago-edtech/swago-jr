import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryCodeBatch, LotteryCode } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: batchId } = await params;

    console.log(`📋 Fetching batch detail: ${batchId}`);

    // 2. Connect to DB
    await connectDB();

    // 3. Fetch batch with product details
    const batch = await LotteryCodeBatch.findById(batchId)
      .populate("productId", "name images")
      .lean() as any; // Type assertion to fix TypeScript error

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    console.log(`✅ Found batch: ${batch.batchNumber}`);

    // 4. Fetch all codes for this batch
    let codes = await LotteryCode.find({ batchId })
      .sort({ code: 1 }) // Sort alphabetically
      .lean() as any[]; // Type assertion

    console.log(`📦 Direct query found ${codes.length} codes for batchId: ${batchId}`);

    // Fallback: Use codeIds if batchId query returns nothing
    if (codes.length === 0 && batch.codeIds && batch.codeIds.length > 0) {
      console.log(`⚠️ Falling back to codeIds query for batch ${batchId}`);
      codes = await LotteryCode.find({ _id: { $in: batch.codeIds } })
        .sort({ code: 1 })
        .lean() as any[];
      console.log(`✅ Fallback query found ${codes.length} codes`);
    }

    // 5. Calculate code stats
    const usedCodesCount = codes.filter((c) => c.isUsed).length;
    const unusedCodesCount = codes.length - usedCodesCount;

    // 6. Return batch with codes
    return NextResponse.json({
      success: true,
      batch: JSON.parse(JSON.stringify(batch)),
      codes: JSON.parse(JSON.stringify(codes)),
      codeStats: {
        total: codes.length,
        used: usedCodesCount,
        unused: unusedCodesCount,
      },
    });
  } catch (error) {
    console.error("Error fetching batch detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch detail" },
      { status: 500 }
    );
  }
}
