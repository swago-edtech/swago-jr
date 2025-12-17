import { NextRequest, NextResponse } from 'next/server';
import { connectDB, AmbassadorApplication } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    
    const { id } = await params;
    const { status, adminNotes } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'under_review', 'shortlisted', 'selected', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await connectDB();

    const updateData: any = { 
      status,
      updatedAt: new Date(),
    };

    // Add admin notes if provided
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    // Add review metadata for non-pending statuses
    if (status !== 'pending') {
      updateData.reviewedAt = new Date();
      // You can add reviewedBy if you track admin user
    }

    const application = await AmbassadorApplication.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application._id,
        status: application.status,
      },
    });
  } catch (error: any) {
    console.error('Update application status error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
  }
}
