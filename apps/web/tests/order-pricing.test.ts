/**
 * Run: npx tsx --test apps/web/tests/order-pricing.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  priceOrder,
  parseCartLines,
  clientTotalDrifted,
  INDIA_PRICING_COUNTRY,
  type PriceOrderDeps,
  type PricingProduct,
  type PricingCountry,
} from "../src/lib/order-pricing";

const products: Record<string, PricingProduct> = {
  kit: { _id: "p1", slug: "kit", name: "Kit", price: 1000, weight: 0.5 },
  game: { _id: "p2", slug: "game", name: "Game", price: 500, weight: 0.3, internationalPricing: { USD: { price: 9.99 } } },
  "mini-swago-game-card": { _id: "p3", slug: "mini-swago-game-card", name: "Mini card", price: 299 },
  fixedship: { _id: "p4", slug: "fixedship", name: "Fixed", price: 800, internationalShipping: { USD: { fee: 4 } } },
};
const deps = (coupon?: { discountAmount: number; code?: string } | Error): PriceOrderDeps => ({
  loadProduct: async (ref) => products[ref] || Object.values(products).find((p) => p._id === ref) || null,
  validateCoupon: async () => {
    if (coupon instanceof Error) throw coupon;
    return { coupon: { code: coupon?.code || "SAVE" }, discountAmount: coupon?.discountAmount || 0 };
  },
});
const US: PricingCountry = { code: "US", currency: "USD", exchangeRate: 0.012, currencySymbol: "$", shippingFee: 1000, shippingTiers: [] };

test("parseCartLines rejects bad quantities and refs", () => {
  assert.equal(parseCartLines([]).ok, false);
  assert.equal(parseCartLines([{ productId: "kit", quantity: 0 }]).ok, false);
  assert.equal(parseCartLines([{ productId: "kit", quantity: -2 }]).ok, false);
  assert.equal(parseCartLines([{ productId: "kit", quantity: 1.5 }]).ok, false);
  assert.equal(parseCartLines([{ productId: "kit", quantity: 100 }]).ok, false);
  assert.equal(parseCartLines([{ quantity: 1 }]).ok, false);
  const ok = parseCartLines([{ _id: "kit", quantity: 2, price: 1 }]);
  assert.ok(ok.ok && ok.lines[0].ref === "kit" && ok.lines[0].clientPrice === 1);
});

test("India prepaid: DB prices, no shipping, client price ignored", async () => {
  const r = await priceOrder({ lines: [{ ref: "kit", quantity: 2, clientPrice: 5 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" }, deps());
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.pricing.subtotal, 2000);
  assert.equal(r.pricing.total, 2000);
  assert.equal(r.pricing.currency, "INR");
  assert.equal(r.pricing.amountMinor, 200000);
  assert.equal(r.pricing.shippingFee, 0);
});

test("India COD: ₹50 below threshold, free at threshold", async () => {
  const below = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "cod", promotion: { shippingThreshold: 1450 } }, deps());
  assert.ok(below.ok && below.pricing.shippingFee === 50 && below.pricing.total === 1050);
  const above = await priceOrder({ lines: [{ ref: "kit", quantity: 2 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "cod", promotion: { shippingThreshold: 1450 } }, deps());
  assert.ok(above.ok && above.pricing.shippingFee === 0);
});

test("COD outside India rejected", async () => {
  const r = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }], country: US, paymentMethod: "cod" }, deps());
  assert.ok(!r.ok && r.code === "INDIA_ONLY");
});

test("unknown product rejects (no client price fallback)", async () => {
  const r = await priceOrder({ lines: [{ ref: "ghost", quantity: 1, clientPrice: 1, name: "Ghost" }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" }, deps());
  assert.ok(!r.ok && r.status === 409 && r.code === "PRODUCT_UNAVAILABLE");
});

test("US: local fixed price + config shipping, charged in USD cents", async () => {
  const r = await priceOrder({ lines: [{ ref: "game", quantity: 2 }, { ref: "kit", quantity: 1 }], country: US, paymentMethod: "razorpay" }, deps());
  assert.ok(r.ok);
  if (!r.ok) return;
  // game: fixed $9.99 ×2; kit: 1000 × 0.012 = $12
  assert.equal(r.pricing.local.merchandise, 31.98);
  // config flat fee ₹1000 → $12
  assert.equal(r.pricing.local.shipping, 12);
  assert.equal(r.pricing.displayTotal, 43.98);
  assert.equal(r.pricing.amountMinor, 4398);
  assert.equal(r.pricing.currency, "USD");
  assert.equal(r.pricing.items[0].localPrice, 9.99);
});

test("US: product fixed shipping once per line", async () => {
  const r = await priceOrder({ lines: [{ ref: "fixedship", quantity: 3 }], country: US, paymentMethod: "razorpay" }, deps());
  assert.ok(r.ok && r.pricing.local.shipping === 4);
});

test("bonus claim honoured only with DB slug + threshold, one unit", async () => {
  const ok = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }, { ref: "mini-swago-game-card", quantity: 1, clientPrice: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" }, deps());
  assert.ok(ok.ok && ok.pricing.items[1].price === 1 && ok.pricing.subtotal === 1001);
  const under = await priceOrder({ lines: [{ ref: "game", quantity: 1 }, { ref: "mini-swago-game-card", quantity: 1, clientPrice: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" }, deps());
  assert.ok(!under.ok && under.code === "BONUS_INVALID");
  const many = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }, { ref: "mini-swago-game-card", quantity: 3, clientPrice: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" }, deps());
  assert.ok(!many.ok && many.code === "BONUS_INVALID");
  // price 1 on a non-bonus product is just ignored (DB price used)
  const fake = await priceOrder({ lines: [{ ref: "kit", quantity: 1, clientPrice: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" }, deps());
  assert.ok(fake.ok && fake.pricing.subtotal === 1000);
});

test("coupon: capped at subtotal, error surfaces as 400", async () => {
  const big = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay", couponCode: "ALL" }, deps({ discountAmount: 5000 }));
  assert.ok(big.ok && big.pricing.discount === 1000 && big.pricing.total === 0 && big.pricing.amountMinor === 0);
  const bad = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay", couponCode: "X" }, deps(new Error("expired")));
  assert.ok(!bad.ok && bad.status === 400 && /expired/.test(bad.error));
});

test("coupon never eats international shipping", async () => {
  const r = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }], country: US, paymentMethod: "razorpay", couponCode: "ALL" }, deps({ discountAmount: 5000 }));
  assert.ok(r.ok && r.pricing.displayTotal === 12 && r.pricing.amountMinor === 1200);
});

test("Swago Money rules", async () => {
  const base = { lines: [{ ref: "kit", quantity: 1 }], country: INDIA_PRICING_COUNTRY, paymentMethod: "razorpay" as const };
  assert.equal((await priceOrder({ ...base, swagoMoneyRedeemed: 50, walletBalance: 100 }, deps())).ok, true);
  const tooMuch = await priceOrder({ ...base, swagoMoneyRedeemed: 51, walletBalance: 100 }, deps());
  assert.ok(!tooMuch.ok && tooMuch.code === "WALLET_MAX");
  const poor = await priceOrder({ ...base, swagoMoneyRedeemed: 50, walletBalance: 10 }, deps());
  assert.ok(!poor.ok && poor.code === "WALLET_BALANCE");
  const neg = await priceOrder({ ...base, swagoMoneyRedeemed: -5, walletBalance: 10 }, deps());
  assert.ok(!neg.ok && neg.code === "WALLET_INVALID");
  const small = await priceOrder({ ...base, lines: [{ ref: "game", quantity: 1 }], swagoMoneyRedeemed: 10, walletBalance: 100 }, deps());
  assert.ok(!small.ok && small.code === "WALLET_MIN");
  const express = await priceOrder({ ...base, swagoMoneyRedeemed: 10, walletBalance: 100, isExpress: true }, deps());
  assert.ok(!express.ok);
});

test("misconfigured international country rejected", async () => {
  const r = await priceOrder({ lines: [{ ref: "kit", quantity: 1 }], country: { code: "CA", currency: "INR", exchangeRate: 1 }, paymentMethod: "razorpay" }, deps());
  assert.ok(!r.ok && r.code === "COUNTRY_NOT_CONFIGURED");
});

test("drift detection compares charged currency", () => {
  const p = { displayTotal: 43.98, currency: "USD" };
  assert.equal(clientTotalDrifted(p, undefined), false);
  assert.equal(clientTotalDrifted(p, { total: 43.9, currency: "USD" }), false);
  assert.equal(clientTotalDrifted(p, { total: 40, currency: "USD" }), true);
  assert.equal(clientTotalDrifted(p, { total: 43.98, currency: "INR" }), true);
  assert.equal(clientTotalDrifted({ displayTotal: 1000, currency: "INR" }, { total: 1001, currency: "INR" }), false);
});
