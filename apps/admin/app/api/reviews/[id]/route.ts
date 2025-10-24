import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Review } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await requireAdmin();
    
    // Connect to database
    await connectDB();

    // Get review ID from params
    const { id } = await params;

    // Find and delete review
    const review = await Review.findByIdAndDelete(id);

    // Check if review exists
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
      deletedReviewId: id,
    });
  } catch (error: any) {
    console.error('Delete review error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}