import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Review } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();
    
    // Connect to database
    await connectDB();

    // Get request body
    const { ids, action } = await request.json();

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Review IDs are required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Determine status based on action
    const status = action === 'approve' ? 'approved' : 'rejected';

    // Update multiple reviews
    const result = await Review.updateMany(
      { _id: { $in: ids } },
      { 
        status,
        updatedAt: new Date(),
      }
    );

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
      message: `${result.modifiedCount} review(s) ${action}d successfully`,
    });
  } catch (error: any) {
    console.error('Bulk update reviews error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update reviews' },
      { status: 500 }
    );
  }
}