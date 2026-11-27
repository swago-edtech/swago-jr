// Offline tests for the pure helpers (no DB). npx tsx --test scripts/migrations/address-hardening.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { classifyOrder, convertPromotionStates, planStateCodeBackfill, toCsv } from "./address-hardening";

test("consistent Indian order is not flagged", () => {
  assert.equal(classifyOrder({ _id: 1, address: "12 MG Road", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "IN", phone: "+919876543210" }), null);
});

test("Indian address charged as US (VPN) is flagged", () => {
  const r = classifyOrder({ _id: 2, address: "12 MG Road", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "US", phone: "+919876543210" });
  assert.ok(r && r.reasons.some((x) => x.startsWith("COUNTRY_MISMATCH:US->IN")));
});

test("pincode/state mismatch and foreign phone are flagged", () => {
  const r = classifyOrder({ _id: 3, address: "x", city: "Delhi", state: "Maharashtra", pincode: "110001", country: "IN", phone: "+14155550100" });
  assert.ok(r);
  assert.ok(r!.reasons.includes("NON_INDIAN_PHONE_INDIAN_ADDRESS"));
  assert.ok(r!.reasons.some((x) => x.startsWith("POSTAL")));
});

test("unknown state is flagged", () => {
  const r = classifyOrder({ _id: 4, address: "x", city: "y", state: "California", pincode: "90210", country: "IN" });
  assert.ok(r);
});

test("backfill plan", () => {
  assert.deepEqual(planStateCodeBackfill({ _id: 1, state: "Orissa" }), { action: "set", stateCode: "IN-OD" });
  assert.deepEqual(planStateCodeBackfill({ _id: 1, state: "IN-MH", stateCode: "IN-MH" }), { action: "skip", reason: "already-set" });
  assert.equal(planStateCodeBackfill({ _id: 1, state: "Atlantis" }).action, "skip");
});

test("promotion conversion", () => {
  assert.deepEqual(convertPromotionStates(["Maharashtra", "IN-MH", "Ladakh", "Nowhere"]), { codes: ["IN-MH", "IN-LA"], unknown: ["Nowhere"] });
});

test("csv escapes formulas and quotes", () => {
  const csv = toCsv([{ id: "1", orderId: '=HYPERLINK("x")', createdAt: "", status: "", chargedCountry: "IN", chargedCurrency: "INR", addressCountry: "IN", stateCode: "", pincode: "", totalInr: 1, reasons: ["A"] }]);
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
});
