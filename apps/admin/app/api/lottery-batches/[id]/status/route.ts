import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryCodeBatch } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

const VALID_STATUSES = ["pending", "downloaded", "sent_for_printing", "printed"] as const;

type BatchStatus = typeof VALID_STATUSES[number];

const STATUS_WORKFLOW: Record<BatchStatus, BatchStatus[]> = {
  pending: ["downloaded", "sent_for_printing"],
  downloaded: ["sent_for_printing", "printed"],
  sent_for_printing: ["printed"],
  printed: [],
};

export async function PATCH(
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

    // 2. Parse request body
    const body = await req.json();
    const { status, notes } = body;

    // 3. Validate new status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // 4. Connect to DB and fetch batch
    await connectDB();

    const batch = await LotteryCodeBatch.findById(batchId);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // 5. Validate status transition
    const currentStatus = batch.status as BatchStatus;
    
    if (currentStatus === status) {
      return NextResponse.json(
        { error: `Batch is already in "${status}" status` },
        { status: 400 }
      );
    }

    // Check if transition is allowed
    const allowedTransitions = STATUS_WORKFLOW[currentStatus] || [];
    
    if (!allowedTransitions.includes(status as BatchStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${currentStatus}" to "${status}". Allowed transitions: ${allowedTransitions.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    // 6. Update batch status
    batch.status = status;

    // Update relevant timestamp fields
    const now = new Date();

    switch (status) {
      case "downloaded":
        batch.downloadedAt = now;
        batch.downloadedBy = adminEmail;
        break;
      case "sent_for_printing":
        batch.sentForPrintingAt = now;
        batch.sentForPrintingBy = adminEmail;
        break;
      case "printed":
        batch.printedAt = now;
        batch.printedBy = adminEmail;
        break;
    }

    // Add notes if provided
    if (notes) {
      batch.notes = notes;
    }

    await batch.save();

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: `Batch status updated to "${status}"`,
      batch: {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        status: batch.status,
        downloadedAt: batch.downloadedAt,
        downloadedBy: batch.downloadedBy,
        sentForPrintingAt: batch.sentForPrintingAt,
        sentForPrintingBy: batch.sentForPrintingBy,
        printedAt: batch.printedAt,
        printedBy: batch.printedBy,
        notes: batch.notes,
      },
    });
  } catch (error) {
    console.error("Error updating batch status:", error);
    return NextResponse.json(
      { error: "Failed to update batch status" },
      { status: 500 }
    );
  }
}
