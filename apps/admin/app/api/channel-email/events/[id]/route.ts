import { NextRequest, NextResponse } from "next/server";
import {
  applyChannelEvent,
  assignChannelEventProduct,
  cutMissingChannelItems,
  recheckChannelEvent,
  ignoreChannelEvent,
  rematchChannelEvent,
  resolveInterruptedChannelEvent,
} from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const by = session?.email || session?.userId || "admin";
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    if (action === "apply") {
      const event = await applyChannelEvent(id, by);
      return NextResponse.json({ success: true, event });
    }
    if (action === "rematch") {
      const event = await rematchChannelEvent(id);
      return NextResponse.json({ success: true, event });
    }
    if (action === "mark_applied" || action === "release_retry") {
      const event = await resolveInterruptedChannelEvent(id, action, by);
      return NextResponse.json({ success: true, event });
    }
    if (action === "assign_product") {
      const event = await assignChannelEventProduct(
        id,
        Number(body.itemIndex),
        String(body.productId || ""),
        by
      );
      return NextResponse.json({ success: true, event });
    }
    if (action === "recheck") {
      const preview = await recheckChannelEvent(id);
      return NextResponse.json({ success: true, preview });
    }
    if (action === "cut_missing") {
      const lines = Array.isArray(body.lines) ? body.lines : [];
      const event = await cutMissingChannelItems(id, lines, by);
      return NextResponse.json({ success: true, event });
    }
    if (action === "ignore") {
      const event = await ignoreChannelEvent(id);
      return NextResponse.json({ success: true, event });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
