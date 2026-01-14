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

    const adminEmail = session.email || "admin";
    const { id: batchId } = await params;

    console.log(`📥 Download request for batch: ${batchId}`);

    // 2. Connect to DB
    await connectDB();

    // 3. Fetch batch
    const batch = await LotteryCodeBatch.findById(batchId);

    if (!batch) {
      console.log(`❌ Batch not found: ${batchId}`);
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    console.log(`✅ Found batch: ${batch.batchNumber}`);

    // 4. Fetch all codes for this batch
    const codes = await LotteryCode.find({ batchId: batchId })
      .sort({ code: 1 })
      .lean();

    console.log(`📦 Found ${codes.length} codes for batch ${batchId}`);

    if (codes.length === 0) {
      // 🆕 DEBUG: Try alternative query
      const codesByString = await LotteryCode.find({ batchId: batchId.toString() }).lean();
      console.log(`Alternative query found: ${codesByString.length} codes`);
      
      // Try using codeIds from batch
      const codesByIds = await LotteryCode.find({ _id: { $in: batch.codeIds } }).lean();
      console.log(`Query by codeIds found: ${codesByIds.length} codes`);
      
      if (codesByIds.length > 0) {
        // Use codes from codeIds array
        const csvRows = codesByIds.map((code: any, index: number) => {
          return `${index + 1},${code.code},no`;
        });
        const csvContent = "ID,Code,Printed\n" + csvRows.join("\n");
        
        // Update batch status
        if (batch.status === "pending") {
          batch.status = "downloaded";
          batch.downloadedAt = new Date();
          batch.downloadedBy = adminEmail;
          await batch.save();
        }
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${batch.batchNumber}.csv"`,
          },
        });
      }
      
      return NextResponse.json(
        { error: "No codes found for this batch" },
        { status: 404 }
      );
    }

    // 5. Generate CSV content with ID, Code, Printed columns
    const csvRows = codes.map((code: any, index: number) => {
      return `${index + 1},${code.code},no`;
    });

    const csvContent = "ID,Code,Printed\n" + csvRows.join("\n");

    // 6. Update batch status to "downloaded" if it's pending
    if (batch.status === "pending") {
      batch.status = "downloaded";
      batch.downloadedAt = new Date();
      batch.downloadedBy = adminEmail;
      await batch.save();
    }

    // 7. Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${batch.batchNumber}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error downloading batch CSV:", error);
    return NextResponse.json(
      { error: "Failed to download CSV" },
      { status: 500 }
    );
  }
}
