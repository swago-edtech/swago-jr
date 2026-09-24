import { NextRequest, NextResponse } from "next/server";
import { completeGmailOAuth } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

const CALLBACK_PATH = "/api/channel-email/google/callback";

function resolveGoogleRedirectUri(request: NextRequest) {
  const fromEnv = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return `${request.nextUrl.origin}${CALLBACK_PATH}`;
}

function resolveAppOrigin(request: NextRequest) {
  const redirectUri = resolveGoogleRedirectUri(request);
  try {
    return new URL(redirectUri).origin;
  } catch {
    return request.nextUrl.origin;
  }
}

export async function GET(request: NextRequest) {
  const origin = resolveAppOrigin(request);
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/inventory/channel-email?error=missing_code`);
  }

  try {
    const redirectUri = resolveGoogleRedirectUri(request);
    await completeGmailOAuth(code, redirectUri);
    return NextResponse.redirect(`${origin}/inventory/channel-email?connected=1`);
  } catch (error) {
    console.error("Gmail OAuth callback failed:", error);
    return NextResponse.redirect(`${origin}/inventory/channel-email?error=oauth_failed`);
  }
}
