import { NextResponse } from 'next/server';
import { connectDB, AmbassadorApplication } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const applications = await AmbassadorApplication.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('Get applications error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
