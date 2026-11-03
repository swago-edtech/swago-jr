// Client helpers: send stored UTM attribution with signup / OAuth complete

import { getOrderAttributionPayload, type OrderAttributionPayload } from "@/lib/attribution";

export const GOOGLE_OAUTH_ATTRIBUTION_KEY = "swago_oauth_attribution";

/** Snapshot current attribution for JSON bodies (OTP verify, etc.). */
export function getAuthAttributionPayload(): OrderAttributionPayload {
  try {
    return getOrderAttributionPayload();
  } catch {
    return {};
  }
}

/** Persist attribution across Google OAuth redirect hop. */
export function stashAttributionForOAuth(): void {
  if (typeof window === "undefined") return;
  try {
    const payload = getOrderAttributionPayload();
    if (!payload.utm_source && !payload.utm_content && !payload.firstTouch && !payload.lastTouch) {
      sessionStorage.removeItem(GOOGLE_OAUTH_ATTRIBUTION_KEY);
      return;
    }
    sessionStorage.setItem(GOOGLE_OAUTH_ATTRIBUTION_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function takeStashedOAuthAttribution(): OrderAttributionPayload {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(GOOGLE_OAUTH_ATTRIBUTION_KEY);
    sessionStorage.removeItem(GOOGLE_OAUTH_ATTRIBUTION_KEY);
    if (!raw) return getOrderAttributionPayload();
    return { ...getOrderAttributionPayload(), ...JSON.parse(raw) };
  } catch {
    return getOrderAttributionPayload();
  }
}
