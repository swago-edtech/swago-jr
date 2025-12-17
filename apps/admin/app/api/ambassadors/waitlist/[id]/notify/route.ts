import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Waitlist } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    
    const { id } = await params;
    const { notified } = await request.json();

    await connectDB();

    const entry = await Waitlist.findByIdAndUpdate(
      id,
      { notified, updatedAt: new Date() },
      { new: true }
    );

    if (!entry) {
      return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry._id,
        notified: entry.notified,
      },
    });
  } catch (error: any) {
    console.error('Update waitlist error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to update waitlist entry' }, { status: 500 });
  }
}
