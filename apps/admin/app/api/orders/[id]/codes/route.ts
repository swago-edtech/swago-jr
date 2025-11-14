import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ProductCode } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await requireAdmin();

    const { id } = await params;

    // Connect to database
    await connectDB();

    // Fetch all codes for this order
    const codes = await ProductCode.find({ orderId: id }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      codes: codes.map(code => ({
        id: code._id,
        code: code.code,
        productId: code.productId,
        isUsed: code.isUsed,
        usedBy: code.usedBy,
        usedAt: code.usedAt,
        createdAt: code.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Fetch codes error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch codes' },
      { status: 500 }
    );
  }
}