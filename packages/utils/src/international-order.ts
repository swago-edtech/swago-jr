/**
 * Display helpers for INTERNATIONAL orders (order.country !== "IN" and order.currency !== "INR").
 * Every function returns null / is a no-op for domestic orders so India rendering stays untouched.
 *
 * Order ledger fields (total, subtotal, discount, items[].price, internationalShippingFee) are INR.
 * The charged amount is `displayTotal` in `currency` (local). Local line prices are stored on
 * items as `localPrice` for new international orders; older orders fall back to INR × rate.
 */

export type InternationalOrderLike = {
  country?: string | null;
  currency?: string | null;
  currencySymbol?: string | null;
  exchangeRateUsed?: number | null;
  displayTotal?: number | null;
  total?: number | null;
  subtotal?: number | null;
  discount?: number | null;
  swagoMoneyRedeemed?: number | null;
  internationalShippingFee?: number | null;
  internationalShippingBreakdown?: { feeLocal?: number | null } | null;
  items?: Array<{ price?: number | null; quantity?: number | null; localPrice?: number | null }> | null;
};

export type InternationalOrderDisplay = {
  country: string;
  currency: string;
  symbol: string;
  rate: number;
  items: Array<{ localPrice: number; localLineTotal: number }>;
  subtotalLocal: number;
  discountLocal: number;
  swagoLocal: number;
  shippingLocal: number;
  shippingINR: number;
  totalLocal: number;
  /** e.g. "$12.50" (HTML / UI). */
  format: (amountLocal: number) => string;
  /** e.g. "USD 12.50" (PDF fonts without currency glyphs). */
  formatCode: (amountLocal: number) => string;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "CA$",
  AED: "د.إ",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
  SGD: "S$",
  NZD: "NZ$",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function isInternationalOrder(order: InternationalOrderLike | null | undefined): boolean {
  if (!order) return false;
  const country = String(order.country || "IN").trim().toUpperCase();
  const currency = String(order.currency || "INR").trim().toUpperCase();
  return country !== "IN" && currency !== "INR";
}

export function getCurrencySymbol(currency: string, stored?: string | null): string {
  if (stored && String(stored).trim()) return String(stored).trim();
  const code = String(currency || "").toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

/**
 * Same composition as the INR ledger (merchandise − coupon, floored at 0, − Swago Money + shipping),
 * so coupons / Swago Money can never eat into shipping and the total is never negative.
 */
export function computeInternationalDisplayTotal(parts: {
  localMerchandise: number;
  localDiscount?: number;
  localSwago?: number;
  localShipping?: number;
}): number {
  const afterCoupon = Math.max(0, (parts.localMerchandise || 0) - (parts.localDiscount || 0));
  return round2(Math.max(0, afterCoupon - (parts.localSwago || 0) + (parts.localShipping || 0)));
}

export function getInternationalOrderDisplay(
  order: InternationalOrderLike | null | undefined
): InternationalOrderDisplay | null {
  if (!order || !isInternationalOrder(order)) return null;
  const currency = String(order.currency).trim().toUpperCase();
  const country = String(order.country).trim().toUpperCase();
  const rate = Number(order.exchangeRateUsed) > 0 ? Number(order.exchangeRateUsed) : 0;
  const toLocal = (inr: number) => round2((Number(inr) || 0) * rate);

  const items = (order.items || []).map((item) => {
    const qty = Number(item?.quantity) || 0;
    const localPrice =
      item?.localPrice !== undefined && item?.localPrice !== null && Number.isFinite(Number(item.localPrice))
        ? Number(item.localPrice)
        : toLocal(Number(item?.price) || 0);
    return { localPrice, localLineTotal: round2(localPrice * qty) };
  });

  const subtotalLocal = round2(items.reduce((s, i) => s + i.localLineTotal, 0));
  const discountLocal = toLocal(Number(order.discount) || 0);
  const swagoLocal = toLocal(Number(order.swagoMoneyRedeemed) || 0);
  const shippingINR = Number(order.internationalShippingFee) || 0;
  const storedShipLocal = order.internationalShippingBreakdown?.feeLocal;
  const shippingLocal =
    storedShipLocal !== undefined && storedShipLocal !== null && Number.isFinite(Number(storedShipLocal))
      ? round2(Number(storedShipLocal))
      : toLocal(shippingINR);
  const totalLocal =
    order.displayTotal !== undefined && order.displayTotal !== null && Number.isFinite(Number(order.displayTotal))
      ? round2(Number(order.displayTotal))
      : computeInternationalDisplayTotal({
          localMerchandise: subtotalLocal,
          localDiscount: discountLocal,
          localSwago: swagoLocal,
          localShipping: shippingLocal,
        });

  const symbol = getCurrencySymbol(currency, order.currencySymbol);
  return {
    country,
    currency,
    symbol,
    rate,
    items,
    subtotalLocal,
    discountLocal,
    swagoLocal,
    shippingLocal,
    shippingINR,
    totalLocal,
    format: (n: number) => `${symbol}${(Number(n) || 0).toFixed(2)}`,
    formatCode: (n: number) => `${currency} ${(Number(n) || 0).toFixed(2)}`,
  };
}
