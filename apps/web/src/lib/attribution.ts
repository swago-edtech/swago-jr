// Client-side UTM attribution (7-day first + last touch)

export const ATTRIBUTION_WINDOW_DAYS = 7;
export const ATTRIBUTION_STORAGE_KEY = "swago_attribution_v1";

export type UtmTouch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string; // creator_id
  term?: string; // placement: story | reel | dm | bio | etc
  landingPath?: string;
  referrer?: string;
  capturedAt: string; // ISO
};

export type StoredAttribution = {
  firstTouch?: UtmTouch;
  lastTouch?: UtmTouch;
  windowDays: number;
};

export type OrderAttributionPayload = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  firstTouch?: UtmTouch;
  lastTouch?: UtmTouch;
  windowDays?: number;
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().slice(0, 200);
  return v || undefined;
}

export function parseUtmFromSearch(search: string | URLSearchParams): Partial<UtmTouch> | null {
  const params = typeof search === "string" ? new URLSearchParams(search.startsWith("?") ? search : `?${search}`) : search;
  const source = clean(params.get("utm_source"));
  const medium = clean(params.get("utm_medium"));
  const campaign = clean(params.get("utm_campaign"));
  const content = clean(params.get("utm_content"));
  const term = clean(params.get("utm_term"));

  if (!source && !medium && !campaign && !content && !term) return null;

  return { source, medium, campaign, content, term };
}

export function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      firstTouch: parsed.firstTouch,
      lastTouch: parsed.lastTouch,
      windowDays: parsed.windowDays || ATTRIBUTION_WINDOW_DAYS,
    };
  } catch {
    return null;
  }
}

function isExpired(touch: UtmTouch | undefined, windowDays: number): boolean {
  if (!touch?.capturedAt) return true;
  const ts = new Date(touch.capturedAt).getTime();
  if (Number.isNaN(ts)) return true;
  const maxAgeMs = windowDays * 24 * 60 * 60 * 1000;
  return Date.now() - ts > maxAgeMs;
}

function pruneExpired(stored: StoredAttribution | null): StoredAttribution | null {
  if (!stored) return null;
  const windowDays = stored.windowDays || ATTRIBUTION_WINDOW_DAYS;
  const firstTouch = stored.firstTouch && !isExpired(stored.firstTouch, windowDays) ? stored.firstTouch : undefined;
  const lastTouch = stored.lastTouch && !isExpired(stored.lastTouch, windowDays) ? stored.lastTouch : undefined;
  if (!firstTouch && !lastTouch) return null;
  return { firstTouch, lastTouch, windowDays };
}

export function writeStoredAttribution(data: StoredAttribution): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Capture UTMs from the current URL. Updates last-touch always when UTMs present.
 * Sets first-touch only if missing or expired.
 */
export function captureAttributionFromUrl(opts?: {
  search?: string;
  path?: string;
  referrer?: string;
}): StoredAttribution | null {
  if (typeof window === "undefined") return null;

  const search = opts?.search ?? window.location.search;
  const parsed = parseUtmFromSearch(search);
  if (!parsed) {
    return pruneExpired(readStoredAttribution());
  }

  const now = new Date().toISOString();
  const touch: UtmTouch = {
    ...parsed,
    landingPath: clean(opts?.path ?? window.location.pathname),
    referrer: clean(opts?.referrer ?? (typeof document !== "undefined" ? document.referrer : undefined)),
    capturedAt: now,
  };

  const existing = pruneExpired(readStoredAttribution());
  const windowDays = existing?.windowDays || ATTRIBUTION_WINDOW_DAYS;
  const next: StoredAttribution = {
    firstTouch: existing?.firstTouch || touch,
    lastTouch: touch,
    windowDays,
  };
  writeStoredAttribution(next);
  return next;
}

/** Payload to attach to order APIs (last-touch flat fields + first/last objects). */
export function getOrderAttributionPayload(): OrderAttributionPayload {
  const stored = pruneExpired(readStoredAttribution());
  if (!stored?.lastTouch && !stored?.firstTouch) return {};

  const last = stored.lastTouch || stored.firstTouch;
  return {
    utm_source: last?.source,
    utm_medium: last?.medium,
    utm_campaign: last?.campaign,
    utm_content: last?.content,
    utm_term: last?.term,
    firstTouch: stored.firstTouch,
    lastTouch: stored.lastTouch || stored.firstTouch,
    windowDays: stored.windowDays || ATTRIBUTION_WINDOW_DAYS,
  };
}

export function hasAnyUtm(touch?: Partial<UtmTouch> | null): boolean {
  if (!touch) return false;
  return !!(touch.source || touch.medium || touch.campaign || touch.content || touch.term);
}

export { UTM_KEYS };
