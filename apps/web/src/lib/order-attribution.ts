// Shared server-side normalizer for attribution payloads on order create

export type TouchInput = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPath?: string;
  referrer?: string;
  capturedAt?: string;
};

export type AttributionInput = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  firstTouch?: TouchInput;
  lastTouch?: TouchInput;
  windowDays?: number;
  // express-style nested utm
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().slice(0, 200);
  return v || undefined;
}

function normalizeTouch(touch?: TouchInput | null) {
  if (!touch || typeof touch !== "object") return undefined;
  const source = clean(touch.source);
  const medium = clean(touch.medium);
  const campaign = clean(touch.campaign);
  const content = clean(touch.content);
  const term = clean(touch.term);
  const landingPath = clean(touch.landingPath);
  const referrer = clean(touch.referrer);
  const capturedAt = clean(touch.capturedAt);

  if (!source && !medium && !campaign && !content && !term) return undefined;

  return {
    source,
    medium,
    campaign,
    content,
    term,
    landingPath,
    referrer,
    capturedAt: capturedAt || new Date().toISOString(),
  };
}

/**
 * Accepts flat utm_* fields and/or first/last touch objects and/or express `utm: { source... }`.
 * Returns mongoose-ready order fields. Last-touch wins for flat utm_* convenience fields.
 */
export function buildOrderAttributionFields(input?: AttributionInput | null) {
  if (!input || typeof input !== "object") {
    return {};
  }

  const firstTouch = normalizeTouch(input.firstTouch);
  const lastFromObject = normalizeTouch(input.lastTouch);

  const flatLast = normalizeTouch({
    source: input.utm_source ?? input.source,
    medium: input.utm_medium ?? input.medium,
    campaign: input.utm_campaign ?? input.campaign,
    content: input.utm_content ?? input.content,
    term: input.utm_term ?? input.term,
    capturedAt: new Date().toISOString(),
  });

  const lastTouch = lastFromObject || flatLast;
  const resolvedFirst = firstTouch || lastTouch;

  if (!lastTouch && !resolvedFirst) return {};

  const windowDays =
    typeof input.windowDays === "number" && input.windowDays > 0 && input.windowDays <= 90
      ? Math.floor(input.windowDays)
      : 7;

  return {
    utm_source: lastTouch?.source || resolvedFirst?.source,
    utm_medium: lastTouch?.medium || resolvedFirst?.medium,
    utm_campaign: lastTouch?.campaign || resolvedFirst?.campaign,
    utm_content: lastTouch?.content || resolvedFirst?.content,
    utm_term: lastTouch?.term || resolvedFirst?.term,
    attribution: {
      firstTouch: resolvedFirst,
      lastTouch: lastTouch || resolvedFirst,
      windowDays,
    },
  };
}

export type AcquisitionVia = "otp_phone" | "otp_email" | "google" | "express" | "unknown";

/**
 * First-touch acquisition snapshot for new User documents.
 * Prefer firstTouch; fall back to lastTouch / flat utm_*.
 * Returns {} when nothing attributable — caller should omit the field.
 */
export function buildUserAcquisitionFields(
  input?: AttributionInput | null,
  via: AcquisitionVia = "unknown"
) {
  const orderFields = buildOrderAttributionFields(input);
  const touch = orderFields.attribution?.firstTouch || orderFields.attribution?.lastTouch;
  if (!touch) return {};

  const content = touch.content || orderFields.utm_content;
  return {
    acquisition: {
      source: touch.source || orderFields.utm_source,
      medium: touch.medium || orderFields.utm_medium,
      campaign: touch.campaign || orderFields.utm_campaign,
      content,
      term: touch.term || orderFields.utm_term,
      creatorId: content ? String(content).toLowerCase() : undefined,
      landingPath: touch.landingPath,
      referrer: touch.referrer,
      capturedAt: touch.capturedAt ? new Date(touch.capturedAt) : new Date(),
      via,
    },
  };
}
