import { NextRequest, NextResponse } from "next/server";
import { getGoogleSignInAuthUrl } from "@swago/database";
import { sanitizeAuthRedirect } from "@/lib/storefront-session";

const STATE_COOKIE = "google_oauth_state";
const REDIRECT_COOKIE = "google_oauth_redirect";

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;
    const redirect = sanitizeAuthRedirect(request.nextUrl.searchParams.get("redirect"));
    const state = crypto.randomUUID();

    const url = getGoogleSignInAuthUrl(redirectUri, state);
    const response = NextResponse.redirect(url);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 10,
    };

    response.cookies.set(STATE_COOKIE, state, cookieOptions);
    response.cookies.set(REDIRECT_COOKIE, redirect, cookieOptions);
    return response;
  } catch (error) {
    console.error("Google sign-in start failed:", error);
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("error", "google_not_configured");
    const redirect = request.nextUrl.searchParams.get("redirect");
    if (redirect) loginUrl.searchParams.set("redirect", redirect);
    return NextResponse.redirect(loginUrl);
  }
}
