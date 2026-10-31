import { NextRequest, NextResponse } from "next/server";
import { backfillChannelOrders } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

/** One-time backfill of old applied orders. Body: { apply?: boolean }. Default is a dry run (no writes). */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const by = session?.email || session?.userId || "admin";
    const body = await request.json().catch(() => ({}));
    const result = await backfillChannelOrders({ apply: body?.apply === true, by });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
