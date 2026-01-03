import { NextRequest, NextResponse } from 'next/server';
import { connectDB, LotteryCode, Product, User } from '@swago/database';
import { getLoginSession } from '@/lib/auth';

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
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();

    // 4. Validate code format: SWAGO-XXX-XXXXXX
    if (!/^SWAGO-[A-Z0-9]{2,10}-[A-Z0-9]{6}$/.test(trimmedCode)) {
      return NextResponse.json({ 
        error: 'Invalid code format. Use format: SWAGO-XXX-XXXXXX' 
      }, { status: 400 });
    }

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

    // 7. Get product details
    const product = await Product.findById(lotteryCode.productId);

    if (!product) {
      return NextResponse.json({ 
        error: 'Product not found for this code' 
      }, { status: 404 });
    }

    // 8. Mark code as used
    lotteryCode.isUsed = true;
    lotteryCode.usedBy = user._id;
    lotteryCode.usedAt = new Date();
    await lotteryCode.save();

    // 9. Add to user's lottery tickets
    if (!user.lotteryTickets) {
      user.lotteryTickets = [];
    }

    user.lotteryTickets.push({
      codeId: lotteryCode._id,
      code: trimmedCode,
      productId: product._id,
      productName: product.name,
      shortForm: lotteryCode.shortForm,
      redeemedAt: new Date(),
    });

    await user.save();

    // 10. Return success
    return NextResponse.json({
      success: true,
      message: 'Code redeemed successfully!',
      ticket: {
        code: trimmedCode,
        productName: product.name,
        shortForm: lotteryCode.shortForm,
        redeemedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error redeeming lottery code:', error);
    return NextResponse.json(
      { error: 'Failed to redeem code' },
      { status: 500 }
    );
  }
}
