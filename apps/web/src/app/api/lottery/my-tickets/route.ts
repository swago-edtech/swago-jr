import { NextResponse } from 'next/server';
import { connectDB, User } from '@swago/database';
import { getLoginSession } from '@/lib/auth';

export async function GET() {
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
      });
    }

    // 2. Get user from database
    await connectDB();
    
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone }).select('lotteryTickets');
    } else if (session.email) {
      user = await User.findOne({ email: session.email }).select('lotteryTickets');
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Get lottery tickets (most recent first)
    interface TicketType {
      codeId: string;
      code: string;
      productId: string;
      productName: string;
      shortForm: string;
      redeemedAt: Date | string;
    }
    
    const tickets = (user.lotteryTickets || []) as TicketType[];
    const sortedTickets = tickets.sort((a, b) => {
      return new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime();
    });

    // 4. Return tickets
    return NextResponse.json({
      success: true,
      tickets: sortedTickets,
      total: sortedTickets.length,
    });

  } catch (error) {
    console.error('Error fetching lottery tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
