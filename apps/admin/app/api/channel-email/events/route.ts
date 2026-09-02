import { NextRequest, NextResponse } from "next/server";
import { connectDB, ChannelOrderEvent } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const status = request.nextUrl.searchParams.get("status");
    const filter: Record<string, string> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const events = await ChannelOrderEvent.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    const statusCode = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status: statusCode });
  }
}
