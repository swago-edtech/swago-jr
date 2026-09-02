import { NextResponse } from "next/server";
import { runChannelEmailSync } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await requireAdmin();
    const result = await runChannelEmailSync();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
