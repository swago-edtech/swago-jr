/* eslint-disable @typescript-eslint/no-explicit-any -- mocked module doubles */
/**
 * finalizeOrder must never mark an order Paid unless the captured amount and
 * currency equal the order's server-computed charge.
 * Run (from apps/web): MONGODB_URI=mongodb://127.0.0.1:9/never-connected \
 *   npx tsx --test --experimental-test-module-mocks tests/payment-service.test.mts
 */
import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

const s: any = {};
const reset = () => {
  s.pending = { _id: "o1", orderId: "SWG-1", status: "Pending", currency: "USD", total: 2000, displayTotal: 24, razorpay_order_id: "order_A" };
  s.updates = [] as any[];
  s.fau = [] as any[];
};
reset();
beforeEach(reset);

mock.module("@swago/database", {
  namedExports: {
    connectDB: async () => {},
    Order: {
      findOne: (q: any) => ({
        lean: async () => (q.status === "Pending" ? s.pending : null),
        then: (r: any) => r(null),
      }),
      updateOne: async (f: any, u: any) => {
        s.updates.push({ f, u });
        return {};
      },
      findOneAndUpdate: async (f: any) => {
        s.fau.push(f);
        return null; // stop before side effects; "not finalizable" error is fine for these tests
      },
    },
    User: {},
    Product: {},
    Coupon: {},
  },
});
mock.module("@/lib/msg91-email", { namedExports: { sendOrderConfirmationEmail: async () => {}, sendAdminOrderNotificationEmail: async () => {} } });
mock.module("@/lib/productCache", { namedExports: { invalidateProductCache: () => {} } });
mock.module("@/lib/invoice-service", { namedExports: { generateAndUploadInvoice: async () => {} } });
mock.module("@/lib/inventory-service", {
  namedExports: { deductInventoryForOrder: async () => {}, markInventoryAllocationConsumed: async () => {}, releaseInventoryAllocation: async () => {} },
});

const { finalizeOrder, PaymentMismatchError } = await import("../src/lib/payment-service");

test("currency mismatch: throws, records paymentMismatch, never updates status", async () => {
  await assert.rejects(
    finalizeOrder({ orderIdOrMongoId: "SWG-1", razorpayPaymentId: "pay_1", source: "webhook", payment: { amount: 2400, currency: "INR", order_id: "order_A" } }),
    (e: unknown) => e instanceof PaymentMismatchError
  );
  assert.equal(s.fau.length, 0);
  assert.equal(s.updates[0].u.$set.paymentMismatch.reason, "currency mismatch");
});

test("amount mismatch: throws", async () => {
  await assert.rejects(
    finalizeOrder({ orderIdOrMongoId: "SWG-1", razorpayPaymentId: "pay_1", source: "frontend", payment: { amount: 100, currency: "USD", order_id: "order_A" } }),
    (e: unknown) => e instanceof PaymentMismatchError
  );
  assert.equal(s.fau.length, 0);
});

test("match: proceeds with a guard filter pinned to the checked amount", async () => {
  await assert.rejects(
    finalizeOrder({ orderIdOrMongoId: "SWG-1", razorpayPaymentId: "pay_1", source: "webhook", payment: { amount: 2400, currency: "USD", order_id: "order_A", status: "captured" } }),
    /not finalizable/
  );
  assert.equal(s.fau.length, 1);
  assert.deepEqual(s.fau[0], { _id: "o1", status: "Pending", currency: "USD", displayTotal: 24, total: 2000 });
});

test("zero-total finalize refused for a non-zero order", async () => {
  await assert.rejects(
    finalizeOrder({ orderIdOrMongoId: "SWG-1", razorpayPaymentId: "zero", source: "zero_total", payment: { zeroTotal: true } }),
    /not a zero-total/
  );
  assert.equal(s.fau.length, 0);
});
