/**
 * Single source of truth for order pricing. Used by:
 *   - POST /api/payment/create        (logged-in, Razorpay)
 *   - POST /api/payment/cod           (logged-in, COD, India only)
 *   - POST /api/express/create-order  (express, Razorpay or COD)
 *   - POST /api/checkout/quote        (read-only preview)
 *
 * Rules:
 *   - Every price comes from the database. Client prices are only used as the
 *     "claim" marker for bonus items (price === 1), and the claim is checked
 *     against the DB slug and the DB-priced subtotal.
 *   - Unknown / inactive products reject the order (no client-price fallback).
 *   - Quantities must be integers 1..MAX_LINE_QTY.
 *   - Country/currency/exchange rate come from the validated address +
 *     InternationalConfig (see resolvePricingCountry); never from the client.
 *   - The order ledger (items[].price, subtotal, discount, total, shippingFee)
 *     stays in INR; `displayTotal` in `currency` is what is charged.
 */
import {
  computeInternationalDisplayTotal,
  resolveInternationalShipping,
  type InternationalShippingResult,
  type ShippingTier,
} from "@swago/utils";
import type { AddressCountryCode } from "@swago/utils/address";
import { convertToINR, convertToLocal, getProductPrice } from "./currency";

export const MAX_LINE_QTY = 99;
export const MAX_CART_LINES = 50;
export const SWAGO_MIN_ORDER_INR = 799;
export const SWAGO_MAX_FRACTION = 0.05;
export const DEFAULT_COD_SHIPPING_INR = 50;
export const DEFAULT_FREE_SHIPPING_THRESHOLD_INR = 1450;
const DEFAULT_BONUS_THRESHOLDS: Record<string, number> = {
  "mini-swago-game-card": 999,
  "special-edition-item": 1999,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface PricingCountry {
  code: AddressCountryCode;
  currency: string;
  exchangeRate: number;
  currencySymbol?: string;
  shippingFee?: number;
  shippingTiers?: ShippingTier[];
}

export const INDIA_PRICING_COUNTRY: PricingCountry = {
  code: "IN",
  currency: "INR",
  exchangeRate: 1,
  currencySymbol: "₹",
};

export interface PricingProduct {
  _id: { toString(): string } | string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  internationalPricing?: Parameters<typeof getProductPrice>[0]["internationalPricing"];
  internationalShipping?: Parameters<typeof resolveInternationalShipping>[0][number]["internationalShipping"];
  weight?: number;
  images?: string[];
  [key: string]: unknown;
}

export interface CartLineInput {
  ref: string;
  quantity: number;
  /** price the client showed; only `=== 1` matters (bonus claim). */
  clientPrice?: number;
  image?: string;
  name?: string;
}

export interface PricedOrderItem {
  productId: string;
  name: string;
  price: number; // INR ledger unit price
  quantity: number;
  image: string;
  localPrice?: number; // international orders only (charged currency)
}

export interface PromotionLike {
  isActive?: boolean;
  blockedCodStates?: string[];
  blockedCodPincodes?: string[];
  bonusItems?: Array<{ slug?: string; threshold?: number }>;
  shippingThreshold?: number;
}

export interface PriceOrderInput {
  lines: CartLineInput[];
  country: PricingCountry;
  paymentMethod: "razorpay" | "cod";
  couponCode?: string | null;
  swagoMoneyRedeemed?: number;
  walletBalance?: number;
  userId?: string;
  isExpress?: boolean;
  promotion?: PromotionLike | null;
  /** Use promotion.bonusItems even when the promotion is inactive (legacy payment/create behaviour). */
  bonusFromAnyPromotion?: boolean;
}

export type CouponValidator = (
  code: string,
  amountINR: number,
  cartItems: Array<{ productId: string; price: number; quantity: number }>,
  userId: string | undefined,
  isExpress: boolean,
  display: { currency: string; exchangeRate: number; currencySymbol?: string }
) => Promise<{ coupon: CouponDoc | null; discountAmount: number }>;

/** Minimal shape of a coupon document as used by pricing / routes. */
export type CouponDoc = { _id?: unknown; code?: string } & Record<string, unknown>;

export interface PriceOrderDeps {
  loadProduct: (ref: string) => Promise<PricingProduct | null>;
  validateCoupon: CouponValidator;
}

export interface OrderPricing {
  items: PricedOrderItem[];
  /** product + quantity per line, for stock reservation / shipping */
  lines: Array<{ product: PricingProduct; quantity: number; bonus: boolean }>;
  subtotal: number;
  discount: number;
  coupon: CouponDoc | null;
  swagoMoneyRedeemed: number;
  /** domestic shipping (INR) */
  shippingFee: number;
  /** international shipping (INR ledger) */
  internationalShippingFee: number;
  intlShipping: InternationalShippingResult | null;
  /** INR ledger total */
  total: number;
  country: AddressCountryCode;
  currency: string;
  exchangeRateUsed: number;
  currencySymbol?: string;
  /** Amount charged, in `currency`. */
  displayTotal: number;
  /** Amount charged in minor units (paise / cents / fils) — what Razorpay receives. */
  amountMinor: number;
  local: { merchandise: number; discount: number; swago: number; shipping: number };
}

export type PriceOrderResult =
  | { ok: true; pricing: OrderPricing }
  | { ok: false; status: number; error: string; code: string; details?: unknown };

function fail(status: number, code: string, error: string, details?: unknown): PriceOrderResult {
  return { ok: false, status, code, error, ...(details !== undefined ? { details } : {}) };
}

/**
 * Normalises a client cart (any of the historical shapes) into strict line
 * inputs. Rejects anything that is not a positive integer quantity.
 */
export function parseCartLines(
  cart: unknown
): { ok: true; lines: CartLineInput[] } | { ok: false; error: string; code: string } {
  if (!Array.isArray(cart) || cart.length === 0) return { ok: false, code: "CART_REQUIRED", error: "Cart is required" };
  if (cart.length > MAX_CART_LINES) return { ok: false, code: "CART_TOO_LARGE", error: "Too many items in cart" };
  const lines: CartLineInput[] = [];
  for (const raw of cart) {
    const item = (raw || {}) as Record<string, unknown>;
    const ref = String(item.id ?? item.productId ?? item._id ?? "").trim();
    const qty = Number(item.quantity);
    if (!ref || ref.length > 100) return { ok: false, code: "CART_INVALID", error: `Invalid product in cart${item.name ? `: ${String(item.name).slice(0, 80)}` : ""}` };
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QTY) {
      return { ok: false, code: "CART_INVALID", error: `Invalid quantity for ${String(item.name || ref).slice(0, 80)}` };
    }
    lines.push({
      ref,
      quantity: qty,
      clientPrice: typeof item.price === "number" ? item.price : undefined,
      image: typeof item.image === "string" ? item.image : Array.isArray(item.images) && typeof item.images[0] === "string" ? item.images[0] : undefined,
      name: typeof item.name === "string" ? item.name : undefined,
    });
  }
  return { ok: true, lines };
}

export function bonusThresholdsFrom(promotion: PromotionLike | null | undefined, anyPromotion = false): Record<string, number> {
  const usable = promotion && (anyPromotion || promotion.isActive) && Array.isArray(promotion.bonusItems);
  if (!usable) return { ...DEFAULT_BONUS_THRESHOLDS };
  const out: Record<string, number> = {};
  for (const b of promotion!.bonusItems!) {
    if (b?.slug && Number.isFinite(Number(b.threshold))) out[b.slug] = Number(b.threshold);
  }
  return out;
}

export async function priceOrder(input: PriceOrderInput, deps: PriceOrderDeps): Promise<PriceOrderResult> {
  const { country } = input;
  const isIntl = country.code !== "IN";
  const currency = isIntl ? country.currency : "INR";
  const rate = isIntl ? country.exchangeRate : 1;
  if (isIntl && (!currency || currency === "INR" || !(rate > 0))) {
    return fail(400, "COUNTRY_NOT_CONFIGURED", `Checkout is not configured for ${country.code}.`);
  }
  if (input.paymentMethod === "cod" && isIntl) {
    return fail(400, "INDIA_ONLY", "Cash on Delivery is only available for addresses in India.");
  }

  // ---- products (DB only)
  const thresholds = bonusThresholdsFrom(input.promotion, input.bonusFromAnyPromotion);
  const resolved: Array<{ product: PricingProduct; line: CartLineInput; bonus: boolean }> = [];
  const unavailable: string[] = [];
  for (const line of input.lines) {
    const product = await deps.loadProduct(line.ref);
    if (!product || !Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
      unavailable.push(line.name || line.ref);
      continue;
    }
    const bonus = line.clientPrice === 1 && !!product.slug && thresholds[product.slug] !== undefined;
    resolved.push({ product, line, bonus });
  }
  if (unavailable.length) {
    return fail(409, "PRODUCT_UNAVAILABLE", `${unavailable.slice(0, 3).join(", ")} ${unavailable.length > 1 ? "are" : "is"} no longer available. Please update your cart.`, { unavailable });
  }

  // ---- bonus items: threshold on DB-priced non-bonus subtotal, one unit each
  const nonBonusSubtotal = resolved.filter((r) => !r.bonus).reduce((s, r) => s + Number(r.product.price) * r.line.quantity, 0);
  const seenBonus = new Set<string>();
  for (const r of resolved.filter((x) => x.bonus)) {
    const slug = r.product.slug!;
    if (r.line.quantity !== 1 || seenBonus.has(slug)) return fail(400, "BONUS_INVALID", "Bonus items are limited to one per order.");
    seenBonus.add(slug);
    if (nonBonusSubtotal < thresholds[slug]) {
      console.warn(`[pricing] bonus ${slug} claimed below threshold ₹${thresholds[slug]} (subtotal ₹${nonBonusSubtotal})`);
      return fail(400, "BONUS_INVALID", "Invalid bonus item threshold");
    }
  }

  // ---- line prices
  const items: PricedOrderItem[] = [];
  let localMerchandise = 0;
  for (const { product, line, bonus } of resolved) {
    const local = getProductPrice(
      { price: Number(product.price), originalPrice: product.originalPrice, internationalPricing: product.internationalPricing },
      currency,
      rate
    );
    const unitINR = bonus ? 1 : currency === "INR" ? Number(product.price) : convertToINR(local.price, rate);
    const unitLocal = bonus ? (currency === "INR" ? 1 : convertToLocal(1, rate)) : local.price;
    localMerchandise += unitLocal * line.quantity;
    items.push({
      productId: product._id.toString(),
      name: product.name,
      price: unitINR,
      quantity: line.quantity,
      image: (Array.isArray(product.images) && product.images[0]) || line.image || "",
      ...(isIntl ? { localPrice: unitLocal } : {}),
    });
  }
  localMerchandise = round2(localMerchandise);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  // ---- coupon (DB-verified cart lines, never client prices)
  let discount = 0;
  let coupon: CouponDoc | null = null;
  const code = typeof input.couponCode === "string" ? input.couponCode.trim() : "";
  if (code) {
    if (code.length > 64) return fail(400, "COUPON_INVALID", "Coupon Error: Invalid or inactive coupon code");
    try {
      const r = await deps.validateCoupon(
        code,
        subtotal,
        items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
        input.userId,
        !!input.isExpress,
        { currency, exchangeRate: rate, currencySymbol: country.currencySymbol }
      );
      discount = Math.max(0, Math.min(subtotal, Number(r.discountAmount) || 0));
      coupon = r.coupon;
    } catch (e: unknown) {
      return fail(400, "COUPON_INVALID", `Coupon Error: ${(e as Error | null)?.message || "Invalid coupon"}`);
    }
  }
  const afterCoupon = Math.max(0, subtotal - discount);

  // ---- Swago Money (INR)
  const swago = Number(input.swagoMoneyRedeemed) || 0;
  if (swago < 0 || !Number.isInteger(swago)) return fail(400, "WALLET_INVALID", "Invalid Swago Dollars amount");
  if (swago > 0) {
    if (input.isExpress) return fail(400, "WALLET_INVALID", "Swago Dollars can't be used in express checkout");
    if (afterCoupon < SWAGO_MIN_ORDER_INR) return fail(400, "WALLET_MIN", "Order amount must be ₹799 or more to use Swago Dollars");
    const maxAllowed = Math.trunc(afterCoupon * SWAGO_MAX_FRACTION);
    if (swago > maxAllowed) return fail(400, "WALLET_MAX", `You can only use up to 5% (₹${maxAllowed}) of your order amount in Swago Dollars`);
    if ((Number(input.walletBalance) || 0) < swago) return fail(400, "WALLET_BALANCE", "Insufficient Swago Dollars balance");
  }

  // ---- shipping
  let shippingFee = 0;
  let intlShipping: InternationalShippingResult | null = null;
  if (isIntl) {
    intlShipping = resolveInternationalShipping(
      resolved.map(({ product, line }) => ({
        productId: product._id.toString(),
        name: product.name,
        quantity: line.quantity,
        weight: Number(product.weight) || 0,
        internationalShipping: product.internationalShipping,
      })),
      country,
      currency
    );
  } else if (input.paymentMethod === "cod") {
    const threshold = Number(input.promotion?.shippingThreshold) || DEFAULT_FREE_SHIPPING_THRESHOLD_INR;
    shippingFee = afterCoupon >= threshold ? 0 : DEFAULT_COD_SHIPPING_INR;
  }
  const internationalShippingFee = intlShipping ? intlShipping.feeINR : 0;

  const total = Math.max(0, afterCoupon - swago + shippingFee + internationalShippingFee);
  const localDiscount = isIntl ? convertToLocal(discount, rate) : discount;
  const localSwago = isIntl ? convertToLocal(swago, rate) : swago;
  const localShipping = intlShipping ? intlShipping.feeLocal : shippingFee;
  const displayTotal = isIntl
    ? computeInternationalDisplayTotal({ localMerchandise, localDiscount, localSwago, localShipping })
    : total;

  return {
    ok: true,
    pricing: {
      items,
      lines: resolved.map((r) => ({ product: r.product, quantity: r.line.quantity, bonus: r.bonus })),
      subtotal,
      discount,
      coupon,
      swagoMoneyRedeemed: swago,
      shippingFee,
      internationalShippingFee,
      intlShipping,
      total,
      country: country.code,
      currency,
      exchangeRateUsed: rate,
      currencySymbol: country.currencySymbol,
      displayTotal,
      amountMinor: Math.round(displayTotal * 100),
      local: { merchandise: localMerchandise, discount: localDiscount, swago: localSwago, shipping: localShipping },
    },
  };
}

/** Tolerance check between the total the client displayed and the server price. */
export function clientTotalDrifted(
  pricing: Pick<OrderPricing, "displayTotal" | "currency">,
  expected: { total?: unknown; currency?: unknown } | undefined
): boolean {
  if (!expected || expected.total === undefined || expected.total === null) return false;
  const t = Number(expected.total);
  if (!Number.isFinite(t)) return true;
  if (typeof expected.currency === "string" && expected.currency.toUpperCase() !== pricing.currency) return true;
  const tol = pricing.currency === "INR" ? 1 : 0.5;
  return Math.abs(t - pricing.displayTotal) > tol;
}

/** Fields shared by every order document created from a pricing result. */
export function orderPricingFields(p: OrderPricing) {
  return {
    items: p.items,
    subtotal: p.subtotal,
    discount: p.discount,
    shippingFee: p.shippingFee,
    internationalShippingFee: p.internationalShippingFee,
    ...(p.intlShipping && {
      internationalShippingBreakdown: { feeLocal: p.intlShipping.feeLocal, ...p.intlShipping.breakdown },
    }),
    total: p.total,
    swagoMoneyRedeemed: p.swagoMoneyRedeemed,
    country: p.country,
    currency: p.currency,
    exchangeRateUsed: p.exchangeRateUsed,
    displayTotal: p.displayTotal,
    ...(p.currency !== "INR" && p.currencySymbol ? { currencySymbol: p.currencySymbol } : {}),
    ...(p.coupon && { couponCode: p.coupon.code, couponDetails: p.coupon }),
  };
}
