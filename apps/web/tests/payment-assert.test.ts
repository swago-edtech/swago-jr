import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPaymentMatchesOrder, expectedChargeMinor, safeEqualHex } from "../src/lib/payment-assert";

test("INR order uses total; USD uses displayTotal", () => {
  assert.deepEqual(expectedChargeMinor({ currency: "INR", total: 1050, displayTotal: 1050 }), { currency: "INR", amountMinor: 105000 });
  assert.deepEqual(expectedChargeMinor({ currency: "USD", total: 3665, displayTotal: 43.98 }), { currency: "USD", amountMinor: 4398 });
  assert.ok(Number.isNaN(expectedChargeMinor({ currency: "USD", total: 3665 }).amountMinor));
});

test("matches / mismatches", () => {
  const order = { currency: "USD", total: 3665, displayTotal: 43.98, razorpay_order_id: "order_1" };
  assert.deepEqual(checkPaymentMatchesOrder(order, { amount: 4398, currency: "USD", order_id: "order_1", status: "captured" }), { ok: true });
  const cur = checkPaymentMatchesOrder(order, { amount: 4398, currency: "INR", order_id: "order_1" });
  assert.ok(!cur.ok && cur.reason === "currency mismatch");
  const amt = checkPaymentMatchesOrder(order, { amount: 100, currency: "USD", order_id: "order_1" });
  assert.ok(!amt.ok && amt.reason === "amount mismatch");
  const oid = checkPaymentMatchesOrder(order, { amount: 4398, currency: "USD", order_id: "order_2" });
  assert.ok(!oid.ok && oid.reason === "razorpay order mismatch");
  const failed = checkPaymentMatchesOrder(order, { amount: 4398, currency: "USD", status: "failed" });
  assert.ok(!failed.ok);
  const legacy = checkPaymentMatchesOrder({ total: 999 }, { amount: 99900, currency: "INR" });
  assert.ok(legacy.ok);
});

test("constant-time compare", () => {
  assert.equal(safeEqualHex("abcd", "abcd"), true);
  assert.equal(safeEqualHex("abcd", "abce"), false);
  assert.equal(safeEqualHex("abcd", "abc"), false);
});

test("payment without a Razorpay order id is rejected when the order has one", () => {
  const r = checkPaymentMatchesOrder(
    { currency: "INR", total: 100, displayTotal: 100, razorpay_order_id: "order_A" },
    { amount: 10000, currency: "INR", status: "captured" }
  );
  assert.equal(r.ok, false);
});
