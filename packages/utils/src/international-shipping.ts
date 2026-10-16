/**
 * International shipping resolution (shared by storefront display + server charge routes).
 *
 * Rules:
 * - Product-level fixed shipping (`product.internationalShipping[CURRENCY].fee`, in that
 *   local currency) wins for the visitor's currency. It is charged ONCE PER CART LINE
 *   (per product), regardless of quantity. An explicit fee of 0 means "free shipping for
 *   this product"; a missing entry means "use International Config".
 * - Lines without a fixed fee are grouped: their total weight (weight × qty) is run through
 *   the country's config rules (weight tiers → above-top-tier uses highest tier → otherwise
 *   the flat `shippingFee`). Config fees are stored in INR.
 * - If every line has a fixed fee, no config fee is charged. If no line has one, the result
 *   is identical to the legacy "config fee on total cart weight" behaviour.
 */

export type ShippingTier = { minWeight: number; maxWeight: number; fee: number };

export type ShippingCountryConfig = {
  code?: string;
  currency?: string;
  exchangeRate?: number;
  shippingFee?: number;
  shippingTiers?: ShippingTier[];
};

export type InternationalShippingEntry = { fee: number };

export type InternationalShippingMap =
  | Record<string, InternationalShippingEntry | null | undefined>
  | Map<string, InternationalShippingEntry>;

export type ShippingLineInput = {
  productId?: string | number | null;
  name?: string;
  quantity: number;
  weight?: number | null;
  internationalShipping?: InternationalShippingMap | null;
};

export type ShippingBreakdownLine = {
  productId?: string;
  name?: string;
  quantity: number;
  source: "product" | "config";
  /** Fixed fee (local currency) for product lines; undefined for config lines. */
  feeLocal?: number;
  weight: number;
};

export type InternationalShippingResult = {
  /** Total shipping in the visitor's local currency (2dp). */
  feeLocal: number;
  /** Total shipping in INR for the order ledger (whole rupees). */
  feeINR: number;
  breakdown: {
    currency: string;
    exchangeRate: number;
    fixedFeeLocal: number;
    fixedLineCount: number;
    configWeight: number;
    configFeeINR: number;
    configFeeLocal: number;
    lines: ShippingBreakdownLine[];
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function toLocal(amountINR: number, rate: number): number {
  return round2(amountINR * rate);
}

function toINR(amountLocal: number, rate: number): number {
  if (!rate) return 0;
  return Math.round(amountLocal / rate);
}

/** Legacy config rule: weight tiers → above-top-tier → flat fee. Returns INR. */
export function calculateConfigShippingFeeINR(
  totalWeight: number,
  config: ShippingCountryConfig | null | undefined
): number {
  if (!config) return 0;
  const tiers = Array.isArray(config.shippingTiers) ? config.shippingTiers : [];
  if (tiers.length > 0) {
    const tier = tiers.find((t) => totalWeight >= t.minWeight && totalWeight <= t.maxWeight);
    if (tier) return tier.fee;
    const highestTier = [...tiers].sort((a, b) => b.maxWeight - a.maxWeight)[0];
    if (highestTier && totalWeight > highestTier.maxWeight) return highestTier.fee;
  }
  return config.shippingFee || 0;
}

/** Fixed product shipping fee (local currency) for `currency`, or undefined when unset. */
export function getProductShippingFee(
  map: InternationalShippingMap | null | undefined,
  currency: string
): number | undefined {
  if (!map || !currency) return undefined;
  const key = currency.toUpperCase();
  let entry: InternationalShippingEntry | null | undefined;
  if (map instanceof Map) {
    entry = map.get(key) ?? map.get(currency);
  } else if (typeof map === "object") {
    entry = (map as Record<string, InternationalShippingEntry | null | undefined>)[key] ??
      (map as Record<string, InternationalShippingEntry | null | undefined>)[currency];
  }
  if (!entry || typeof entry !== "object") return undefined;
  const fee = Number(entry.fee);
  if (entry.fee === null || entry.fee === undefined || !Number.isFinite(fee) || fee < 0) {
    return undefined;
  }
  return fee;
}

export function resolveInternationalShipping(
  items: ShippingLineInput[],
  countryConfig: ShippingCountryConfig | null | undefined,
  currency?: string
): InternationalShippingResult {
  const cur = (currency || countryConfig?.currency || "INR").toUpperCase();
  const rate = cur === "INR" ? 1 : Number(countryConfig?.exchangeRate) || 0;

  // Group by product so duplicate lines of the same product count as one line.
  const grouped = new Map<string, ShippingLineInput & { quantity: number }>();
  (items || []).forEach((item, idx) => {
    if (!item) return;
    const qty = Math.max(0, Number(item.quantity) || 0);
    if (qty <= 0) return;
    const key =
      item.productId !== undefined && item.productId !== null && String(item.productId) !== ""
        ? String(item.productId)
        : `__line_${idx}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += qty;
    } else {
      grouped.set(key, { ...item, quantity: qty });
    }
  });

  let fixedFeeLocal = 0;
  let fixedLineCount = 0;
  let configWeight = 0;
  let hasConfigLines = false;
  const lines: ShippingBreakdownLine[] = [];

  grouped.forEach((item, key) => {
    const weightTotal = (Number(item.weight) || 0) * item.quantity;
    const productId = key.startsWith("__line_") ? undefined : key;
    const fixed = cur === "INR" ? undefined : getProductShippingFee(item.internationalShipping, cur);
    if (fixed !== undefined) {
      fixedFeeLocal += fixed;
      fixedLineCount += 1;
      lines.push({ productId, name: item.name, quantity: item.quantity, source: "product", feeLocal: fixed, weight: weightTotal });
    } else {
      hasConfigLines = true;
      configWeight += weightTotal;
      lines.push({ productId, name: item.name, quantity: item.quantity, source: "config", weight: weightTotal });
    }
  });

  fixedFeeLocal = round2(fixedFeeLocal);
  configWeight = Math.round(configWeight * 1000) / 1000;
  const configFeeINR = hasConfigLines ? calculateConfigShippingFeeINR(configWeight, countryConfig) : 0;
  const configFeeLocal = cur === "INR" ? configFeeINR : toLocal(configFeeINR, rate);

  const feeLocal = round2(fixedFeeLocal + configFeeLocal);
  const feeINR = cur === "INR" ? feeLocal : toINR(fixedFeeLocal, rate) + configFeeINR;

  return {
    feeLocal,
    feeINR,
    breakdown: {
      currency: cur,
      exchangeRate: rate,
      fixedFeeLocal,
      fixedLineCount,
      configWeight,
      configFeeINR,
      configFeeLocal,
      lines,
    },
  };
}

/** Sanitize product internationalShipping from admin payloads (blank = unset, 0 = free). */
export function normalizeInternationalShipping(
  input: unknown
): Record<string, InternationalShippingEntry> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, InternationalShippingEntry> = {};
  for (const [rawKey, rawVal] of Object.entries(input as Record<string, unknown>)) {
    const currency = String(rawKey || "").trim().toUpperCase();
    if (!currency || currency === "INR") continue;
    if (!rawVal || typeof rawVal !== "object" || Array.isArray(rawVal)) continue;
    const rawFee = (rawVal as Record<string, unknown>).fee;
    if (rawFee === null || rawFee === undefined || (typeof rawFee === "string" && rawFee.trim() === "")) continue;
    const fee = Number(rawFee);
    if (!Number.isFinite(fee) || fee < 0) continue;
    out[currency] = { fee: round2(fee) };
  }
  return out;
}
