import { NextResponse } from "next/server";
import { connectDB, ExpressConfig } from "@swago/database";

export async function GET() {
  try {
    await connectDB();
    let config = await ExpressConfig.findOne({ isSingleton: true }).lean();
    
    if (!config) {
      config = await ExpressConfig.create({
        isSingleton: true,
        isTimerEnabled: false,
        timerText: "⚡ EXPRESS CHECKOUT — FREE SHIPPING ON ONLINE ORDERS",
        timerMinutes: 10,
        allowPublicCoupons: false,
      });
    }

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const config = await ExpressConfig.findOneAndUpdate(
      { isSingleton: true },
      { 
        $set: {
          isTimerEnabled: body.isTimerEnabled,
          timerText: body.timerText,
          timerMinutes: body.timerMinutes,
          allowPublicCoupons: body.allowPublicCoupons,
        }
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
