import { NextRequest, NextResponse } from "next/server";
import { runChannelEmailSync } from "@swago/database";

// Production: GOOGLE_*, OPENAI_API_KEY or GEMINI_API_KEY, MONGODB_URI, CRON_SECRET
// Local dev: use Admin → Channel Email → "Check mail now" instead; cron auth is skipped here
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

    const result = await runChannelEmailSync();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Channel email sync cron failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
