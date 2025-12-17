import { NextResponse } from 'next/server';
import { connectDB, Waitlist } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const waitlist = await Waitlist.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, waitlist });
  } catch (error: any) {
    console.error('Get waitlist error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }
}
