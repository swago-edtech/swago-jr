// apps/web/src/app/api/lottery/my-tickets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, KidProfile } from '@swago/database';
import { getLoginSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo users have no tickets
    if (session.isDemo) {
      return NextResponse.json({
        success: true,
        tickets: [],
        total: 0,
        kidProfile: null,
      });
    }

    // 🆕 NEW: Get kidProfileId from query params
    const searchParams = request.nextUrl.searchParams;
    const kidProfileId = searchParams.get('kidProfileId');

    if (!kidProfileId) {
      return NextResponse.json({ 
        error: 'Kid profile ID is required' 
      }, { status: 400 });
    }

    // 2. Connect to database
    await connectDB();

    // 🆕 CHANGED: Fetch from KidProfile, not User
    const kidProfile = await KidProfile.findById(kidProfileId)
      .select('username age avatar lotteryTickets ambassador.swagoMoney');

    if (!kidProfile) {
      return NextResponse.json({ 
        error: 'Kid profile not found' 
      }, { status: 404 });
    }

    // 3. Get lottery tickets (most recent first)
    const tickets = (kidProfile.lotteryTickets || []).sort((a: any, b: any) => {
      return new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime();
    });

    // 4. Return tickets with kid profile info
    return NextResponse.json({
      success: true,
      tickets: tickets,
      total: tickets.length,
      kidProfile: {
        _id: kidProfile._id,
        name: kidProfile.username,
        age: kidProfile.age,
        avatar: kidProfile.avatar,
        swagoMoney: kidProfile.ambassador?.swagoMoney || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching lottery tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
