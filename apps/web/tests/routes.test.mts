/* eslint-disable @typescript-eslint/no-explicit-any -- mocked module doubles */
/**
 * API route tests with every external dependency mocked (no DB, no Razorpay,
 * no network). Run:
 *   MONGODB_URI=mongodb://127.0.0.1:9/never-connected \
 *   npx tsx --test --experimental-test-module-mocks apps/web/tests/routes.test.mts
 */
import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ------------------------------------------------------------------ fakes
const USER_ID = "64b000000000000000000001";
const state: any = {};
function reset() {
  state.session = { phone: "+919876543210" };
  state.user = {
    _id: USER_ID,
    orders: [] as unknown[],
    ambassador: { swagoMoney: 0 },
    save: async () => {},
  };
  state.promotion = { isActive: true, shippingThreshold: 1450, bonusItems: [], blockedCodStates: [], blockedCodPincodes: [] };
  state.intlConfig = {
    supportedCountries: [
      { code: "US", currency: "USD", currencySymbol: "$", exchangeRate: 0.012, shippingFee: 1000, isActive: true },
      { code: "CA", currency: "CAD", currencySymbol: "CA$", exchangeRate: 0.016, shippingFee: 1000, isActive: true },
      { code: "AE", currency: "AED", currencySymbol: "د.إ", exchangeRate: 0.044, shippingFee: 800, isActive: true },
    ],
  };
  state.products = {
    kit: { _id: "64b0000000000000000000a1", slug: "kit", name: "Kit", price: 1000, weight: 0.5, images: ["/k.png"] },
    game: { _id: "64b0000000000000000000a2", slug: "game", name: "Game", price: 500, weight: 0.3 },
  };
  state.writes = [] as string[];
  state.orders = [] as any[];
  state.razorpayOrders = [] as any[];
  state.finalized = [] as any[];
  state.usersCreated = 0;
}
reset();

const lean = (v: any) => ({ lean: async () => v, then: (r: any) => r(v) });
const db = {
  connectDB: async () => {},
  User: {
    findOne: () => lean(state.user),
    create: async (doc: any) => {
      state.usersCreated++;
      state.writes.push("User.create");
      return { ...doc, _id: USER_ID, orders: [], save: async () => {} };
    },
    updateOne: async () => ({ modifiedCount: 1 }),
  },
  Promotion: { findOne: () => lean(state.promotion) },
  InternationalConfig: { findOne: () => lean(state.intlConfig) },
  Product: {
    updateOne: async () => {
      state.writes.push("Product.updateOne");
      return {};
    },
    findByIdAndUpdate: async () => {
      state.writes.push("Product.findByIdAndUpdate");
      return {};
    },
  },
  Order: {
    create: async (doc: any) => {
      state.writes.push("Order.create");
      const o = { ...doc, _id: { toString: () => "64b0000000000000000000f1" }, save: async () => {}, toObject: () => ({ ...doc, _id: "64b0000000000000000000f1" }) };
      state.orders.push(o);
      return o;
    },
    findByIdAndDelete: async () => {},
    findOne: () => lean(null),
  },
  Coupon: { updateOne: async () => ({}) },
  ExpressConfig: { findOne: () => lean(null) },
};

mock.module("@swago/database", { namedExports: db });
mock.module("@/lib/auth", { namedExports: { getLoginSession: async () => state.session, isDemoUser: async () => false } });
mock.module("@/lib/product-stock", {
  namedExports: {
    findProductWithAvailability: async (id: string) =>
      state.products[id] || Object.values(state.products).find((p: any) => p._id === id) || null,
  },
});
mock.module("@/lib/cleanupExpiredOrders", { namedExports: { cleanupExpiredOrders: async () => 0 } });
mock.module("@/lib/generateOrderId", { namedExports: { generateOrderId: async () => "SWG-TEST-1" } });
mock.module("@/lib/inventory-service", {
  namedExports: {
    allocateInventoryForOrder: async () => {},
    releaseInventoryAllocation: async () => {},
    InsufficientInventoryError: class extends Error {},
  },
});
mock.module("@/lib/payment-service", {
  namedExports: {
    finalizeOrder: async (args: any) => {
      state.finalized.push(args);
      return { success: true, orderId: args.orderIdOrMongoId };
    },
    PaymentMismatchError: class extends Error {},
  },
});
mock.module("@/lib/msg91-email", {
  namedExports: { sendOrderConfirmationEmail: async () => {}, sendAdminOrderNotificationEmail: async () => {} },
});
mock.module("@/lib/invoice-service", { namedExports: { generateAndUploadInvoice: async () => {} } });
mock.module("@/lib/productCache", { namedExports: { invalidateProductCache: () => {} } });
mock.module("@/lib/msg91", {
  namedExports: {
    formatPhoneForStorage: (p: string) => (p.startsWith("+") ? p : `+${p}`),
    verifyAccessToken: async () => ({ success: true }),
  },
});
class FakeRazorpay {
  orders = {
    create: async (o: any) => {
      state.razorpayOrders.push(o);
      return { id: "order_TEST", amount: o.amount, currency: o.currency };
    },
  };
  payments = { fetch: async () => ({}) };
}
mock.module("razorpay", { defaultExport: FakeRazorpay });

process.env.RAZORPAY_KEY_ID = "rzp_test_dummy";
process.env.RAZORPAY_KEY_SECRET = "dummy-secret-for-tests";
process.env.JWT_SECRET = "dummy-jwt-secret-for-tests-only";
delete process.env.ADDRESS_VALIDATION_MODE;

const create = await import("../src/app/api/payment/create/route");
const cod = await import("../src/app/api/payment/cod/route");
const express = await import("../src/app/api/express/create-order/route");
const quote = await import("../src/app/api/checkout/quote/route");
const infer = await import("../src/app/api/address/infer/route");
const legacyOrders = await import("../src/app/api/orders/route");
const legacyCheckout = await import("../src/app/api/checkout/route");
const legacySave = await import("../src/app/api/save-checkout/route");
const testAuth = await import("../src/app/api/test-auth/route");
const testOrder = await import("../src/app/api/test-order/route");
const testEmail = await import("../src/app/api/test-email/route");
const testMoney = await import("../src/app/api/test/add-swago-money/route");

const post = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const IN_ADDR = { address: "12 Example Street", city: "Chennai", stateCode: "IN-TN", pincode: "600001" };
const US_ADDR = { address: "350 Fifth Avenue", city: "New York", stateCode: "US-NY", pincode: "10118" };
const details = (over: Record<string, unknown> = {}) => ({
  orderDetails: {
    name: "Test User",
    email: "t@example.com",
    phone: "+919876543210",
    ...IN_ADDR,
    cart: [{ productId: "kit", quantity: 1, price: 1000, name: "Kit" }],
    ...over,
  },
});

beforeEach(reset);

// ------------------------------------------------------------------ payment/create
test("create: 401 without session", async () => {
  state.session = null;
  const r = await create.POST(post(details()));
  assert.equal(r.status, 401);
});

test("create: VPN/tampered client country is ignored — IN address is charged INR", async () => {
  const r = await create.POST(post(details({ country: "US", currency: "USD", exchangeRate: 0.012 })));
  assert.equal(r.status, 200);
  const o = state.orders[0];
  assert.equal(o.country, "IN");
  assert.equal(o.currency, "INR");
  assert.equal(o.stateCode, "IN-TN");
  assert.equal(o.state, "Tamil Nadu");
  assert.equal(state.razorpayOrders[0].currency, "INR");
  assert.equal(state.razorpayOrders[0].amount, 100000);
});

test("create: US address with client claiming India is charged USD", async () => {
  const r = await create.POST(post(details({ ...US_ADDR, phone: "+12125550100", country: "IN", currency: "INR", exchangeRate: 1 })));
  assert.equal(r.status, 200);
  const o = state.orders[0];
  assert.equal(o.country, "US");
  assert.equal(o.currency, "USD");
  // kit ₹1000 × 0.012 = $12 + flat shipping ₹1000 → $12
  assert.equal(o.displayTotal, 24);
  assert.equal(state.razorpayOrders[0].currency, "USD");
  assert.equal(state.razorpayOrders[0].amount, 2400);
});

test("create: invalid address rejected before any write", async () => {
  const r = await create.POST(post(details({ stateCode: "IN-KA" })));
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.code, "ADDRESS_INVALID");
  assert.deepEqual(state.writes, []);
});

test("create: missing state (legacy client) rejected", async () => {
  const r = await create.POST(post(details({ stateCode: undefined, state: "Tamil Nadu" })));
  assert.equal(r.status, 400);
  assert.deepEqual(state.writes, []);
});

test("create: price drift returns 409 with quote, nothing written", async () => {
  const r = await create.POST(post({ ...details(), expectedTotal: 900, expectedCurrency: "INR" }));
  assert.equal(r.status, 409);
  const j = await r.json();
  assert.equal(j.code, "PRICE_CHANGED");
  assert.equal(j.quote.total, 1000);
  assert.deepEqual(state.writes, []);
});

test("create: unknown product rejected (no client price fallback)", async () => {
  const r = await create.POST(post(details({ cart: [{ productId: "ghost", quantity: 1, price: 1 }] })));
  assert.equal(r.status, 409);
  assert.deepEqual(state.writes, []);
});

test("create: negative quantity rejected", async () => {
  const r = await create.POST(post(details({ cart: [{ productId: "kit", quantity: -3 }] })));
  assert.equal(r.status, 400);
  assert.deepEqual(state.writes, []);
});

test("create: US address unsupported when InternationalConfig lacks it", async () => {
  state.intlConfig = { supportedCountries: [] };
  const r = await create.POST(post(details({ ...US_ADDR })));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).code, "COUNTRY_NOT_SUPPORTED");
  assert.deepEqual(state.writes, []);
});

test("create: military ZIP blocked", async () => {
  const r = await create.POST(post(details({ ...US_ADDR, pincode: "09001" })));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).fieldErrors[0].code, "MILITARY_NOT_SUPPORTED");
});

test("create: shadow mode lets a postal mismatch through, flagged", async () => {
  process.env.ADDRESS_VALIDATION_MODE = "shadow";
  try {
    const r = await create.POST(post(details({ stateCode: "IN-KA" })));
    assert.equal(r.status, 200);
    assert.ok(state.orders[0].addressFlags.includes("SHADOW_WOULD_REJECT"));
    assert.equal(state.orders[0].stateCode, "IN-KA");
  } finally {
    delete process.env.ADDRESS_VALIDATION_MODE;
  }
});

// ------------------------------------------------------------------ COD
test("cod: US address rejected (India only)", async () => {
  const r = await cod.POST(post(details({ ...US_ADDR })));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).code, "INDIA_ONLY");
  assert.deepEqual(state.writes, []);
});

test("cod: blocked ISO state rejected", async () => {
  state.promotion.blockedCodStates = ["IN-TN"];
  const r = await cod.POST(post(details()));
  assert.equal(r.status, 400);
  assert.equal((await r.json()).code, "COD_BLOCKED");
});

test("cod: valid order, ₹50 shipping below threshold, stores ISO code", async () => {
  const r = await cod.POST(post(details()));
  assert.equal(r.status, 200);
  const o = state.orders[0];
  assert.equal(o.shippingFee, 50);
  assert.equal(o.total, 1050);
  assert.equal(o.currency, "INR");
  assert.equal(o.stateCode, "IN-TN");
});

test("cod: non-Indian phone rejected", async () => {
  const r = await cod.POST(post(details({ phone: "+12125550100" })));
  assert.equal(r.status, 400);
});

// ------------------------------------------------------------------ express
const expressBody = (over: Record<string, unknown> = {}, cust: Record<string, unknown> = {}) => ({
  items: [{ productId: "kit", quantity: 1 }],
  customer: { phone: "+919876543210", email: "e@example.com", name: "E", ...IN_ADDR, ...cust },
  paymentMethod: "razorpay",
  ...over,
});

test("express: invalid address rejected before shadow account is created", async () => {
  state.user = null;
  const r = await express.POST(post(expressBody({}, { stateCode: "IN-KA" })));
  assert.equal(r.status, 400);
  assert.equal(state.usersCreated, 0);
  assert.deepEqual(state.writes, []);
});

test("express: AE address charged AED, client currency ignored", async () => {
  const r = await express.POST(
    post(expressBody({ country: "IN", currency: "INR" }, { address: "Flat 101, Marina Tower", city: "Dubai", stateCode: "AE-DU", pincode: "", phone: "+971501234567" }))
  );
  assert.equal(r.status, 200);
  assert.equal(state.orders[0].currency, "AED");
  assert.equal(state.razorpayOrders[0].currency, "AED");
  assert.equal(state.orders[0].pincode, "");
});

test("express: COD for US address rejected", async () => {
  const r = await express.POST(post(expressBody({ paymentMethod: "cod", accessToken: "x" }, { ...US_ADDR })));
  assert.equal(r.status, 400);
});

// ------------------------------------------------------------------ quote / infer / legacy
test("quote: same pricing path, no writes", async () => {
  const r = await quote.POST(post({ address: US_ADDR, cart: [{ productId: "kit", quantity: 1 }] }));
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.quote.currency, "USD");
  assert.equal(j.quote.total, 24);
  assert.equal(j.codAvailable, false);
  assert.deepEqual(state.writes, []);
});

test("infer: returns candidate states, never decides country alone", async () => {
  const r = await infer.GET(new Request("http://localhost/api/address/infer?postal=600001"));
  const j = await r.json();
  assert.equal(j.matches[0].country, "IN");
  assert.equal(j.matches[0].states[0].code, "IN-TN");
});

test("legacy order endpoints return 410", async () => {
  for (const m of [legacyOrders, legacyCheckout, legacySave]) {
    const r = await m.POST();
    assert.equal(r.status, 410);
  }
});

test("dev test routes are 404 without ENABLE_TEST_ROUTES=true (fail closed)", async () => {
  const prev = process.env.ENABLE_TEST_ROUTES;
  delete process.env.ENABLE_TEST_ROUTES;
  try {
    for (const m of [testAuth, testOrder, testEmail, testMoney]) {
      const r = await m.POST(new Request("http://x/api/test", { method: "POST", body: JSON.stringify({ phone: "+919876543210", otp: "123456", identifier: "x", amount: 1e6 }) }) as never);
      assert.equal(r.status, 404);
    }
    assert.equal(state.writes.length, 0);
  } finally {
    if (prev !== undefined) process.env.ENABLE_TEST_ROUTES = prev;
  }
});
