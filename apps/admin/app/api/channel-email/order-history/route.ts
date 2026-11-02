import { NextRequest, NextResponse } from "next/server";
import { getOrderStockHistory } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

/** Read-only, ledger-based stock history of one order. GET ?orderId=<marketplace order id or MSG-key> */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const orderId = String(request.nextUrl.searchParams.get("orderId") || "").trim().slice(0, 120);
    if (!orderId) return NextResponse.json({ success: false, error: "orderId required" }, { status: 400 });
    const history = await getOrderStockHistory(orderId);
    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
