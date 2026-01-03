import { NextResponse } from 'next/server';
import { connectDB, ContactSubmission } from '@swago/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    const unviewedCount = await ContactSubmission.countDocuments({
      isViewed: false,
    });

    return NextResponse.json({ count: unviewedCount });
  } catch (error) {
    console.error('Error fetching unviewed count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unviewed count' },
      { status: 500 }
    );
  }
}
