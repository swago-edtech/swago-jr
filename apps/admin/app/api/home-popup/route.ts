import { NextResponse } from "next/server";
import { connectDB, PopupConfig } from "@swago/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    let config = await PopupConfig.findOne({ isSingleton: true });
    if (!config) {
      config = await PopupConfig.create({ isSingleton: true });
    }
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Ensure we don't accidentally override the singleton property
    delete body.isSingleton;

    const config = await PopupConfig.findOneAndUpdate(
      { isSingleton: true },
      { $set: body },
      { new: true, upsert: true }
    );
    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
