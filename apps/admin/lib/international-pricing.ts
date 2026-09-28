/** Sanitize product internationalPricing from admin form payloads. */

export type IntlPriceEntry = {
  price: number;
  originalPrice?: number;
};

/**
 * Keeps only currencies with a positive selling price.
 * Empty / zero entries are omitted so storefront falls back to exchange-rate pricing.
 */
export function normalizeInternationalPricing(
  input: unknown
): Record<string, IntlPriceEntry> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const out: Record<string, IntlPriceEntry> = {};

  for (const [rawKey, rawVal] of Object.entries(input as Record<string, unknown>)) {
    const currency = String(rawKey || "")
      .trim()
      .toUpperCase();
    if (!currency || currency === "INR") continue;
    if (!rawVal || typeof rawVal !== "object" || Array.isArray(rawVal)) continue;

    const val = rawVal as Record<string, unknown>;
    const price = Number(val.price);
    if (!Number.isFinite(price) || price <= 0) continue;

    const entry: IntlPriceEntry = { price };
    const originalPrice = Number(val.originalPrice);
    if (Number.isFinite(originalPrice) && originalPrice > 0) {
      entry.originalPrice = originalPrice;
    }
    out[currency] = entry;
  }

  return out;
}

/**
 * Sanitize product internationalShipping from admin form payloads.
 * Blank = unset (storefront uses International Config shipping); explicit 0 = free shipping.
 */
export { normalizeInternationalShipping } from "@swago/utils";
export type { InternationalShippingEntry as IntlShippingEntry } from "@swago/utils";
