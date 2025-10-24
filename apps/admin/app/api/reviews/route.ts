import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Review } from '@swago/database';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();
    
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected
    const sentiment = searchParams.get('sentiment'); // POSITIVE, NEGATIVE, NEUTRAL
    const rating = searchParams.get('rating'); // 1-5
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter object
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (sentiment && sentiment !== 'all') {
      filter.sentimentLabel = sentiment;
    }
    
    if (rating && rating !== 'all') {
      filter.rating = parseInt(rating);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch reviews with populated user data
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name phone email')
        .populate('orderId', '_id')
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}