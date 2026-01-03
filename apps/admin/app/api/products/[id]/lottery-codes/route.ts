import { NextRequest, NextResponse } from 'next/server';
import { connectDB, LotteryCode, Product } from '@swago/database';
import { getAdminSession } from '@/lib/auth';

// GET: Fetch all lottery codes for a product
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    await connectDB();

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get all codes for this product
    const codes = await LotteryCode.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats
    const totalCodes = codes.length;
    const usedCodes = codes.filter((c: any) => c.isUsed).length;
    const unusedCodes = totalCodes - usedCodes;

    return NextResponse.json({
      success: true,
      codes: JSON.parse(JSON.stringify(codes)),
      stats: {
        total: totalCodes,
        used: usedCodes,
        unused: unusedCodes,
      },
    });
  } catch (error) {
    console.error('Error fetching lottery codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lottery codes' },
      { status: 500 }
    );
  }
}

// POST: Upload CSV and bulk insert codes
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    await connectDB();

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Parse request body (expecting { codes: string[] })
    const body = await req.json();
    const { codes } = body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        { error: 'Codes array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate and clean codes + extract short forms
    const validCodes: Array<{ code: string; shortForm: string }> = [];
    const invalidCodes: string[] = [];

    for (const code of codes) {
      const trimmed = code.trim().toUpperCase();

      // ✅ Validate format: SWAGO-XXX-XXXXXX
      if (/^SWAGO-[A-Z0-9]{2,10}-[A-Z0-9]{6}$/.test(trimmed)) {
        // ✅ Extract short form from code
        const parts = trimmed.split('-');
        const shortForm = parts[1]; // SWAGO-TST-HWRGC6 → TST

        // ✅ Verify this short form belongs to this product
        if (!product.shortForms || !product.shortForms.includes(shortForm)) {
          invalidCodes.push(`${code} (short form "${shortForm}" not registered for this product)`);
          continue;
        }

        validCodes.push({ code: trimmed, shortForm });
      } else {
        invalidCodes.push(code);
      }
    }

    if (validCodes.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid codes found. Format must be: SWAGO-XXX-XXXXXX where XXX is a registered short form',
          invalidCodes: invalidCodes.slice(0, 10), // Show first 10 invalid codes
          registeredShortForms: product.shortForms || [],
        },
        { status: 400 }
      );
    }

    // Remove duplicates
    const uniqueCodes = Array.from(
      new Map(validCodes.map(item => [item.code, item])).values()
    );

    // Check for existing codes in database
    const codeStrings = uniqueCodes.map(c => c.code);
    const existingCodes = await LotteryCode.find({
      code: { $in: codeStrings },
    }).lean();

    const existingCodeStrings = existingCodes.map((c: any) => c.code);
    const newCodes = uniqueCodes.filter((c) => !existingCodeStrings.includes(c.code));

    if (newCodes.length === 0) {
      return NextResponse.json(
        { error: 'All codes already exist in database' },
        { status: 400 }
      );
    }

    // ✅ Bulk insert new codes with extracted short forms
    const lotteryCodes = newCodes.map((item) => ({
      productId,
      code: item.code,
      shortForm: item.shortForm, // Extracted from code
      isUsed: false,
      usedBy: null,
      usedAt: null,
    }));

    const result = await LotteryCode.insertMany(lotteryCodes);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${result.length} lottery codes`,
      stats: {
        total: codes.length,
        valid: validCodes.length,
        added: result.length,
        duplicates: existingCodeStrings.length,
        invalid: invalidCodes.length,
      },
      invalidCodes: invalidCodes.length > 0 ? invalidCodes.slice(0, 5) : undefined,
    });
  } catch (error) {
    console.error('Error uploading lottery codes:', error);
    return NextResponse.json(
      { error: 'Failed to upload lottery codes' },
      { status: 500 }
    );
  }
}

// DELETE: Remove all unused codes for a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;

    await connectDB();

    // Delete only unused codes
    const result = await LotteryCode.deleteMany({
      productId,
      isUsed: false,
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} unused lottery codes`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting lottery codes:', error);
    return NextResponse.json(
      { error: 'Failed to delete lottery codes' },
      { status: 500 }
    );
  }
}
