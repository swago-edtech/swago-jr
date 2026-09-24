import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthUrl } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

const CALLBACK_PATH = "/api/channel-email/google/callback";

function resolveGoogleRedirectUri(request: NextRequest) {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `${request.nextUrl.origin}${CALLBACK_PATH}`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const redirectUri = resolveGoogleRedirectUri(request);
    const url = getGmailAuthUrl(redirectUri);
    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    const status = error.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
