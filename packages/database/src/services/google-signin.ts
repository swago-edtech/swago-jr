import { google } from "googleapis";
import { getGoogleOAuthClient } from "./channel-email-sync";

const GOOGLE_SIGNIN_SCOPES = [
  "openid",
  "email",
  "profile",
];

export type GoogleSignInProfile = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

export function getGoogleSignInAuthUrl(redirectUri: string, state: string) {
  const client = getGoogleOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: GOOGLE_SIGNIN_SCOPES,
    state,
    include_granted_scopes: false,
  });
}

export async function completeGoogleSignIn(
  code: string,
  redirectUri: string
): Promise<GoogleSignInProfile> {
  const oauth = getGoogleOAuthClient(redirectUri);
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth });
  const { data } = await oauth2.userinfo.get();

  const email = String(data.email || "").trim().toLowerCase();
  const googleId = String(data.id || "").trim();

  if (!email || !googleId) {
    throw new Error("Google did not return a verified email address");
  }

  return {
    googleId,
    email,
    name: String(data.name || "").trim(),
    picture: data.picture || undefined,
  };
}
