/** Resolve product card/PDP promo banner text for a visitor country. */

type PromoEntry = { enabled?: boolean; message?: string };

export type ProductPromoSource = {
  showPromotionalMessage?: boolean;
  promotionalMessage?: string;
  promotionalMessagesByCountry?:
    | Record<string, PromoEntry>
    | Map<string, PromoEntry>
    | null;
};

function readCountryEntry(
  map: ProductPromoSource["promotionalMessagesByCountry"],
  countryCode: string
): PromoEntry | undefined {
  if (!map) return undefined;
  const code = countryCode.toUpperCase();
  if (map instanceof Map) {
    return map.get(code) || map.get(countryCode);
  }
  return map[code] || map[countryCode];
}

/**
 * Returns the banner message to show for `countryCode`, or null to hide.
 * Prefer promotionalMessagesByCountry; fall back to legacy IN-only fields.
 */
export function resolveProductPromoBanner(
  product: ProductPromoSource | null | undefined,
  countryCode: string | null | undefined
): string | null {
  if (!product || !countryCode) return null;
  const code = String(countryCode).trim().toUpperCase();
  if (!code) return null;

  const entry = readCountryEntry(product.promotionalMessagesByCountry, code);
  if (entry) {
    const message = String(entry.message ?? "").trim();
    if (entry.enabled && message) return message;
    // Explicit country row exists but is off / empty → hide (do not use legacy)
    return null;
  }

  // Legacy fallback: only for India when no country map entry exists
  if (
    code === "IN" &&
    product.showPromotionalMessage &&
    String(product.promotionalMessage ?? "").trim()
  ) {
    return String(product.promotionalMessage).trim();
  }

  return null;
}
