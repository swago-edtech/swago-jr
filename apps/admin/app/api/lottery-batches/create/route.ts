import { NextRequest, NextResponse } from "next/server";
import { connectDB, LotteryCodeBatch, LotteryCode, Product } from "@swago/database";
import { getAdminSession } from "@/lib/auth";


// Character set for code generation
const DIGITS = "0123456789"; // All digits 0-9


// Generate unique suffix (6 digits)
function generateUniqueSuffix(usedSuffixes: Set<string>): string {
  let suffix = "";
  let attempts = 0;
  const maxAttempts = 100;

  do {
    suffix = "";
    for (let i = 0; i < 6; i++) {
      suffix += DIGITS[Math.floor(Math.random() * DIGITS.length)];
    }
    
    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error("Unable to generate unique suffix");
    }
  } while (usedSuffixes.has(suffix));

  return suffix;
}


// Generate batch number: BATCH-{shortForm}-{YYYYMMDD}-{counter}
async function generateBatchNumber(shortForm: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  
  // Find today's batches for this short form
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  
  const todayBatches = await LotteryCodeBatch.countDocuments({
    shortForm,
    generatedAt: { $gte: todayStart, $lt: todayEnd },
  });
  
  const counter = String(todayBatches + 1).padStart(3, "0");
  return `BATCH-${shortForm}-${dateStr}-${counter}`;
}


export async function POST(req: NextRequest) {
  try {
    // 1. Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = session.email || "admin";

    // 2. Parse request
    const body = await req.json();
    const { productId, shortForm, quantity } = body;

    // 3. Validate inputs
    if (!productId || !shortForm || !quantity) {
      return NextResponse.json(
        { error: "Product ID, short form, and quantity are required" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 10000) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 10,000" },
        { status: 400 }
      );
    }

    // 4. Connect to DB and get product
    await connectDB();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify short form belongs to product
    if (!product.shortForms?.includes(shortForm)) {
      return NextResponse.json(
        { error: "Short form not found for this product" },
        { status: 400 }
      );
    }

    // 5. Get existing suffixes for this short form (global check)
    const existingCodes = await LotteryCode.find({ shortForm }).select("code");
    const usedSuffixes = new Set(
      existingCodes.map((c) => c.code.split("-")[2]) // Extract suffix from SWAGO-XXX-SUFFIX
    );

    // 6. Generate batch number
    const batchNumber = await generateBatchNumber(shortForm);

    // 7. Generate codes
    const generatedCodes = [];
    const allUsedSuffixes = new Set([...usedSuffixes]);

    for (let i = 0; i < qty; i++) {
      const suffix = generateUniqueSuffix(allUsedSuffixes);
      allUsedSuffixes.add(suffix);

      const code = `SWAGO-${shortForm}-${suffix}`;
      generatedCodes.push({
        code,
        suffix,
      });
    }

    // 8. Create batch document
    const batch = new LotteryCodeBatch({
      batchNumber,
      productId: product._id,
      productName: product.name,
      shortForm,
      quantity: qty,
      status: "pending",
      generatedBy: adminEmail,
      generatedAt: new Date(),
      codeIds: [], // Will populate after saving codes
    });

    await batch.save();

    console.log(`✅ Created batch: ${batch.batchNumber} with ID: ${batch._id}`);

    // 9. Create lottery code documents
    const codeDocuments = generatedCodes.map((gc) => ({
      productId: product._id,
      code: gc.code,
      shortForm,
      batchId: batch._id,
      isUsed: false,
      usedBy: null,
      usedAt: null,
    }));

    console.log(`💾 Inserting ${codeDocuments.length} codes with batchId: ${batch._id}`);

    const savedCodes = await LotteryCode.insertMany(codeDocuments);

    console.log(`✅ Saved ${savedCodes.length} codes. First code batchId: ${savedCodes[0]?.batchId}`);

    // 10. Update batch with code IDs
    batch.codeIds = savedCodes.map((c) => c._id);
    await batch.save();

    console.log(`✅ Updated batch with ${batch.codeIds.length} code references`);

    // 11. Return success
    return NextResponse.json({
      success: true,
      message: `Successfully generated batch with ${qty} codes`,
      batch: {
        _id: batch._id,
        batchNumber: batch.batchNumber,
        productName: batch.productName,
        shortForm: batch.shortForm,
        quantity: batch.quantity,
        status: batch.status,
        generatedAt: batch.generatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating lottery batch:", error);
    return NextResponse.json(
      { error: "Failed to create batch: " + (error as Error).message },
      { status: 500 }
    );
  }
}
