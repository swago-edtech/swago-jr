import { NextResponse } from "next/server";
import { connectDB, PopupConfig } from "@swago/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const config = await PopupConfig.findOne({ isSingleton: true });
    
    // If no config exists, or it's not active, don't return it
    if (!config || !config.isActive) {
      return NextResponse.json({ success: true, config: null });
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
