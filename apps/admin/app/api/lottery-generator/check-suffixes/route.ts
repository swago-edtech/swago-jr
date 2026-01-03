import { NextRequest, NextResponse } from 'next/server';
import { connectDB, LotteryCode } from '@swago/database';
import { getAdminSession } from '@/lib/auth';

// POST: Get all existing suffixes for uniqueness check
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { shortForm } = body;

    if (!shortForm || typeof shortForm !== 'string') {
      return NextResponse.json(
        { error: 'Short form is required' },
        { status: 400 }
      );
    }

    const trimmedShortForm = shortForm.trim().toUpperCase();

    await connectDB();

    // Get ALL codes with this short form across all products
    // Format: SWAGO-XXX-XXXXXX
    // We need to extract the last 6 characters (suffix)
    const codes = await LotteryCode.find({ shortForm: trimmedShortForm })
      .select('code')
      .lean();

    // Extract suffixes (last 6 characters after last hyphen)
    const suffixes = new Set<string>();

    for (const codeDoc of codes) {
      const code = (codeDoc as any).code as string;
      const parts = code.split('-');
      
      if (parts.length === 3) {
        const suffix = parts[2]; // SWAGO-XXX-XXXXXX -> XXXXXX
        if (suffix && suffix.length === 6) {
          suffixes.add(suffix);
        }
      }
    }

    return NextResponse.json({
      success: true,
      suffixes: Array.from(suffixes),
      totalCodes: codes.length,
    });
  } catch (error) {
    console.error('Error checking suffixes:', error);
    return NextResponse.json(
      { error: 'Failed to check suffixes' },
      { status: 500 }
    );
  }
}
