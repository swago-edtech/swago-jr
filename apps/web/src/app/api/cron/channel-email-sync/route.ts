import { NextRequest, NextResponse } from "next/server";
import { runChannelEmailSync, runChannelSellerApiSync } from "@swago/database";

// Seller APIs (optional): AMAZON_SP_* and/or FLIPKART_APP_* — unconfigured platforms are skipped
// Local/admin: Inventory → Channel Sync → "Check mail now" / "Sync seller APIs"
// Worker polls this route on localhost; no CRON_SECRET gate (PM2 internal only).
export async function GET(_req: NextRequest) {
  try {
    // Soft success for needsReconnect — no 500 / stack spam. Service logs once when marking.
    const email = await runChannelEmailSync();
    let sellerApi = null;
    let sellerApiError = "";
    try {
      sellerApi = await runChannelSellerApiSync();
    } catch (error) {
      sellerApiError = error instanceof Error ? error.message : "Seller API sync failed";
      console.error("Channel seller API sync failed:", sellerApiError);
    }
    return NextResponse.json({
      success: true,
      email,
      sellerApi,
      ...(sellerApiError ? { sellerApiError } : {}),
    });
  } catch (error) {
    console.error("Channel email sync cron failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
