import { InternationalConfig } from "@swago/database";
import type { ShippingCountryConfig } from "@swago/utils";

/**
 * Server-trusted country settings for INTERNATIONAL (non-IN) orders.
 * Currency / exchange rate come from InternationalConfig, never from the client.
 */
export type ServerIntlCountry = ShippingCountryConfig & {
  code: string;
  name?: string;
  currency: string;
  currencySymbol?: string;
  exchangeRate: number;
};

type StoredCountry = {
  code?: string;
  name?: string;
  currency?: string;
  currencySymbol?: string;
  exchangeRate?: number;
  shippingFee?: number;
  shippingTiers?: Array<{ minWeight?: number; maxWeight?: number; fee?: number }>;
  isActive?: boolean;
};

export type ServerIntlCountryResult =
  | { ok: true; country: ServerIntlCountry }
  | { ok: false; error: string };

/** Normalizes a client-sent country code; missing → "IN" (legacy default). */
export function normalizeCountryCode(raw: unknown): string {
  const code = String(raw ?? "").trim().toUpperCase();
  return code || "IN";
}

/**
 * Looks up an active, non-INR country in InternationalConfig.
 * Only call this for non-IN orders; the domestic path does not use it.
 */
export async function resolveServerIntlCountry(countryCode: string): Promise<ServerIntlCountryResult> {
  const code = normalizeCountryCode(countryCode);
  const config = (await InternationalConfig.findOne({ isSingleton: true }).lean()) as
    | { supportedCountries?: StoredCountry[] }
    | null;
  const match = (config?.supportedCountries || []).find(
    (c) => String(c?.code || "").toUpperCase() === code
  );

  if (!match || match.isActive === false) {
    return { ok: false, error: `Sorry, we don't ship to ${code} yet.` };
  }

  const currency = String(match.currency || "").trim().toUpperCase();
  const exchangeRate = Number(match.exchangeRate);
  if (!currency || currency === "INR" || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    return { ok: false, error: `International checkout is not configured for ${code}.` };
  }

  return {
    ok: true,
    country: {
      code,
      name: match.name,
      currency,
      currencySymbol: match.currencySymbol ? String(match.currencySymbol) : undefined,
      exchangeRate,
      shippingFee: Number(match.shippingFee) || 0,
      shippingTiers: Array.isArray(match.shippingTiers)
        ? match.shippingTiers.map((t) => ({
            minWeight: Number(t.minWeight) || 0,
            maxWeight: Number(t.maxWeight) || 0,
            fee: Number(t.fee) || 0,
          }))
        : [],
    },
  };
}
