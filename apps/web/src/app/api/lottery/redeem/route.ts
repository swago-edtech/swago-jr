// apps/web/src/app/api/lottery/redeem/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB, LotteryCode, Product, User } from '@swago/database';
import { getLoginSession } from '@/lib/auth';

// Ticket type mapping
const TICKET_TYPES = {
  SSR: {
    name: "Diamond Ticket",
    productName: "Seek Rush",
  },
  SDC: {
    name: "Golden Ticket",
    productName: "Scarf Dumb Charades",
  },
} as const;

export async function POST(req: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Demo users can't redeem codes
    if (session.isDemo) {
      return NextResponse.json({
        error: 'Demo users cannot redeem lottery codes'
      }, { status: 403 });
    }

    // 2. Get user from database
    await connectDB();

    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Parse request body
    const body = await req.json();
    const { code } = body; // ✅ No more kidProfileId needed

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    // 4. Validate code format: SWAGO-XXX-XXXXXX
    if (!/^SWAGO-(SSR|SDC)-[A-Z0-9]{6}$/.test(trimmedCode)) {
      return NextResponse.json({
        error: 'Invalid code format. Use format: SWAGO-SSR-XXXXXX or SWAGO-SDC-XXXXXX'
      }, { status: 400 });
    }

    // Extract shortForm and ticketType from code
    const shortForm = trimmedCode.split('-')[1] as 'SSR' | 'SDC';
    const ticketType = TICKET_TYPES[shortForm].name;

    // 5. Find the code in database
    const lotteryCode = await LotteryCode.findOne({ code: trimmedCode });

    if (!lotteryCode) {
      return NextResponse.json({
        error: 'Invalid code. This code does not exist.'
      }, { status: 404 });
    }

    // 6. Check if already used
    if (lotteryCode.isUsed) {
      return NextResponse.json({
        error: 'This code has already been redeemed.'
      }, { status: 400 });
    }

    // Verify shortForm matches
    if (lotteryCode.shortForm !== shortForm) {
      return NextResponse.json({
        error: `This code is for ${lotteryCode.shortForm} product, but you entered ${shortForm}`
      }, { status: 400 });
    }

    // 7. Get product details
    const product = await Product.findById(lotteryCode.productId);

    if (!product) {
      return NextResponse.json({
        error: 'Product not found for this code'
      }, { status: 404 });
    }

    // 8. Mark code as used — now points to User._id
    lotteryCode.isUsed = true;
    lotteryCode.usedBy = user._id;
    lotteryCode.usedAt = new Date();
    await lotteryCode.save();

    // 9. Use helper method to redeem ticket directly on User
    await user.redeemLotteryCode({
      codeId: lotteryCode._id,
      code: trimmedCode,
      productId: product._id,
      productName: product.name,
      shortForm: lotteryCode.shortForm,
      ticketType: ticketType,
    });

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: 'Code redeemed successfully!',
      ticket: {
        code: trimmedCode,
        productName: product.name,
        shortForm: lotteryCode.shortForm,
        ticketType: ticketType,
        swagoMoneyEarned: 20,
        redeemedAt: new Date().toISOString(),
      },
      user: {
        _id: user._id,
        name: user.name,
        newBalance: user.ambassador?.swagoMoney || 20,
        totalTickets: user.lotteryTickets?.length || 1,
      },
    });

  } catch (error) {
    console.error('Error redeeming lottery code:', error);
    return NextResponse.json(
      { error: 'Failed to redeem code. Please try again.' },
      { status: 500 }
    );
  }
}
