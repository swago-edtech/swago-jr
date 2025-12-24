import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ContactSubmission } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    await requireAdmin();

    const { id } = await params;
    const { status } = await request.json();

    // Validate status
    if (!['pending', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Update submission status
    const submission = await ContactSubmission.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission._id,
        status: submission.status,
      },
    });
  } catch (error: any) {
    console.error('Update contact status error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
