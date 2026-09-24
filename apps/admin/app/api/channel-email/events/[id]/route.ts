import { NextRequest, NextResponse } from "next/server";
import { applyChannelEvent, ignoreChannelEvent, rematchChannelEvent } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const action = body.action;

    if (action === "apply") {
      const event = await applyChannelEvent(id);
      return NextResponse.json({ success: true, event });
    }
    if (action === "rematch") {
      const event = await rematchChannelEvent(id);
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
