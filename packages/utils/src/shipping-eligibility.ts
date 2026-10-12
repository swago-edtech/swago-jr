/**
 * Countries we fulfill orders to.
 * Visitors outside this set may browse (USD prices) but cannot cart/checkout.
 */
export const SHIPPABLE_COUNTRY_CODES = ["IN", "US", "CA", "AE"] as const;

export type ShippableCountryCode = (typeof SHIPPABLE_COUNTRY_CODES)[number];

export const UNSUPPORTED_SHIPPING_MESSAGE =
  "Shipping to your country is coming soon.";

export function normalizeCountryCode(raw: unknown): string {
  const code = String(raw ?? "").trim().toUpperCase();
  return code || "IN";
}

/** True when we can fulfill orders to this ISO country code. */
export function canShipToCountry(code: unknown): boolean {
  const normalized = normalizeCountryCode(code);
  return (SHIPPABLE_COUNTRY_CODES as readonly string[]).includes(normalized);
}
