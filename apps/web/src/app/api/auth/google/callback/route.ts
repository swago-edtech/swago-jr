import { NextRequest, NextResponse } from "next/server";
import { completeGoogleSignIn, connectDB } from "@swago/database";
import { findOrLinkGoogleUser } from "@/lib/google-account";
import {
  attachSessionCookie,
  sanitizeAuthRedirect,
  signStorefrontSession,
} from "@/lib/storefront-session";

const STATE_COOKIE = "google_oauth_state";
const REDIRECT_COOKIE = "google_oauth_redirect";

function failRedirect(origin: string, error: string, redirect?: string) {
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", error);
  if (redirect) loginUrl.searchParams.set("redirect", redirect);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirect = sanitizeAuthRedirect(request.cookies.get(REDIRECT_COOKIE)?.value);
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");

  const clearOauthCookies = (response: NextResponse) => {
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(REDIRECT_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (oauthError) {
    return clearOauthCookies(failRedirect(origin, "google_denied", redirect));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return clearOauthCookies(failRedirect(origin, "google_failed", redirect));
  }

  try {
    await connectDB();
    const profile = await completeGoogleSignIn(code, `${origin}/api/auth/google/callback`);
    const { user } = await findOrLinkGoogleUser(profile);
    const token = await signStorefrontSession(user);

    const continueUrl = new URL("/login/google/continue", origin);
    continueUrl.searchParams.set("redirect", redirect);

    const response = NextResponse.redirect(continueUrl);
    attachSessionCookie(response, token);
    return clearOauthCookies(response);
  } catch (error) {
    console.error("Google sign-in callback failed:", error);
    return clearOauthCookies(failRedirect(origin, "google_failed", redirect));
  }
}
