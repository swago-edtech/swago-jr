import { NextRequest, NextResponse } from "next/server";
import { backfillChannelOrders, REPAIR_CONFIRM } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

/**
 * Per-order repair of old channel orders.
 * Body: {} -> dry run (no writes): expected vs actual component cuts per order.
 * Body: { apply: true, confirm: "REPAIR", orderIds: [...] } -> fix ONLY those orders (re-computed server-side).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const by = session?.email || session?.userId || "admin";
    const body = await request.json().catch(() => ({}));
    const apply = body?.apply === true;
    if (apply && body?.confirm !== REPAIR_CONFIRM) {
      return NextResponse.json({ success: false, error: `Confirm with "${REPAIR_CONFIRM}"` }, { status: 400 });
    }
    const orderIds = Array.isArray(body?.orderIds) ? body.orderIds.map(String).slice(0, 2000) : [];
    const result = await backfillChannelOrders({ apply, confirm: body?.confirm, orderIds, by });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
