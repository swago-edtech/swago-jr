import { NextRequest, NextResponse } from "next/server";
import { completeGmailOAuth } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/inventory/channel-email?error=missing_code`);
  }

  try {
    const redirectUri = `${origin}/api/channel-email/google/callback`;
    await completeGmailOAuth(code, redirectUri);
    return NextResponse.redirect(`${origin}/inventory/channel-email?connected=1`);
  } catch (error) {
    console.error("Gmail OAuth callback failed:", error);
    return NextResponse.redirect(`${origin}/inventory/channel-email?error=oauth_failed`);
  }
}
