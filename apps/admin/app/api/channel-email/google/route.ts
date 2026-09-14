import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthUrl } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const redirectUri = `${request.nextUrl.origin}/api/channel-email/google/callback`;
    const url = getGmailAuthUrl(redirectUri);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
