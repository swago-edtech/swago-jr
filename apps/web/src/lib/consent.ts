// Cookie / localStorage consent preferences

export const CONSENT_STORAGE_KEY = "swago_consent_v1";

export type ConsentPreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt?: string;
  version: 1;
};

export const DEFAULT_CONSENT: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  version: 1,
};

export function readConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (!parsed || parsed.version !== 1) return null;
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: parsed.decidedAt,
      version: 1,
    };
  } catch {
    return null;
  }
}

export function writeConsent(prefs: Omit<ConsentPreferences, "necessary" | "version"> & { analytics: boolean; marketing: boolean }): ConsentPreferences {
  const next: ConsentPreferences = {
    necessary: true,
    analytics: !!prefs.analytics,
    marketing: !!prefs.marketing,
    decidedAt: new Date().toISOString(),
    version: 1,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("swago:consent", { detail: next }));
    } catch {
      // ignore
    }
  }
  return next;
}

export function hasAnalyticsConsent(): boolean {
  return !!readConsent()?.analytics;
}

export function hasMarketingConsent(): boolean {
  return !!readConsent()?.marketing;
}

export function hasDecidedConsent(): boolean {
  return readConsent() !== null;
}
