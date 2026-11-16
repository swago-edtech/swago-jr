import { NextRequest, NextResponse } from "next/server";
import { runChannelEmailSync, runChannelSellerApiSync } from "@swago/database";

// Production: GOOGLE_*, GEMINI_API_KEY, MONGODB_URI, CRON_SECRET
// Seller APIs (optional): AMAZON_SP_* and/or FLIPKART_APP_* — unconfigured platforms are skipped
// Local dev: use Admin → Channel Email → "Check mail now" / "Sync seller APIs"
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      if (!cronSecret) {
        return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
      }
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

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
