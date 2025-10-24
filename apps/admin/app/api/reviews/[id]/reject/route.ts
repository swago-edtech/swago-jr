import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Review } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
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

    // Find and update review status to rejected
    const review = await Review.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        updatedAt: new Date(),
      },
      { new: true } // Return updated document
    )
      .populate('userId', 'name phone email')
      .populate('orderId', '_id');

    // Check if review exists
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Review rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject review error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reject review' },
      { status: 500 }
    );
  }
}