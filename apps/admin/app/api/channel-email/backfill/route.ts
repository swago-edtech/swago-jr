import { NextRequest, NextResponse } from "next/server";
import { backfillChannelOrders, REPAIR_CONFIRM } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

/** Max orders fixed per apply request: the client sends small batches so no request runs long. */
const APPLY_BATCH_MAX = 25;

/**
 * Per-order repair of old channel orders.
 * Body: {} -> dry run (no writes): expected vs actual component cuts per order.
 * Body: { apply: true, confirm: "REPAIR", orderIds: [...<=25] } -> fix ONLY those orders (re-computed server-side).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const by = session?.email || session?.userId || "admin";
    const body = await request.json().catch(() => ({}));
    const apply = body?.apply === true;
    const orderIds: string[] = Array.isArray(body?.orderIds)
      ? [...new Set<string>(body.orderIds.map((i: unknown) => String(i).trim()).filter(Boolean))]
      : [];
    if (apply) {
      if (body?.confirm !== REPAIR_CONFIRM) {
        return NextResponse.json({ success: false, error: `Type "${REPAIR_CONFIRM}" to confirm` }, { status: 400 });
      }
      if (!orderIds.length) {
        return NextResponse.json({ success: false, error: "No order ids: run the preview first" }, { status: 400 });
      }
      if (orderIds.length > APPLY_BATCH_MAX) {
        return NextResponse.json(
          { success: false, error: `Send at most ${APPLY_BATCH_MAX} orders per request` },
          { status: 400 }
        );
      }
    }
    const result = await backfillChannelOrders({
      apply,
      confirm: apply ? REPAIR_CONFIRM : undefined,
      orderIds: orderIds.slice(0, 2000),
      by,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
