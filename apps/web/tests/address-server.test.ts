import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveOrderAddress, isCodBlocked, isIndianPhone, getAddressValidationMode } from "../src/lib/address-server";

const ok = { address: "12 Example Street", city: "Chennai", stateCode: "IN-TN", pincode: "600001", phone: "+919876543210" };

test("enforce: valid IN address resolves to IN", () => {
  const r = resolveOrderAddress(ok, "test", "enforce");
  assert.ok(r.ok && r.address.country === "IN" && r.address.stateName === "Tamil Nadu");
});

test("enforce: mismatch rejected with field errors", () => {
  const r = resolveOrderAddress({ ...ok, stateCode: "IN-KA" }, "test", "enforce");
  assert.ok(!r.ok && r.status === 400 && r.body.code === "ADDRESS_INVALID" && r.body.fieldErrors[0].field === "postalCode");
});

test("shadow: mismatch allowed with SHADOW_WOULD_REJECT, country from state", () => {
  const r = resolveOrderAddress({ ...ok, stateCode: "US-NY", pincode: "600001" }, "test", "shadow");
  assert.ok(r.ok && r.address.country === "US" && r.address.flags.includes("SHADOW_WOULD_REJECT"));
});

test("shadow: missing/invalid state still rejected (no country to price)", () => {
  assert.equal(resolveOrderAddress({ ...ok, stateCode: "" }, "test", "shadow").ok, false);
  assert.equal(resolveOrderAddress({ ...ok, stateCode: "Tamil Nadu" }, "test", "shadow").ok, false);
});

test("client country fields are not inputs at all", () => {
  const r = resolveOrderAddress({ ...ok, country: "US", currency: "USD" } as Parameters<typeof resolveOrderAddress>[0], "test", "enforce");
  assert.ok(r.ok && r.address.country === "IN");
});

test("mode defaults to enforce", () => {
  const prev = process.env.ADDRESS_VALIDATION_MODE;
  delete process.env.ADDRESS_VALIDATION_MODE;
  assert.equal(getAddressValidationMode(), "enforce");
  process.env.ADDRESS_VALIDATION_MODE = "shadow";
  assert.equal(getAddressValidationMode(), "shadow");
  process.env.ADDRESS_VALIDATION_MODE = "bogus";
  assert.equal(getAddressValidationMode(), "enforce");
  if (prev === undefined) delete process.env.ADDRESS_VALIDATION_MODE;
  else process.env.ADDRESS_VALIDATION_MODE = prev;
});

test("COD block list matches ISO codes and legacy names", () => {
  const a = { stateCode: "IN-MN", stateName: "Manipur", postalCode: "795001" };
  assert.equal(isCodBlocked({ blockedCodStates: ["IN-MN"] }, a), true);
  assert.equal(isCodBlocked({ blockedCodStates: ["manipur"] }, a), true);
  assert.equal(isCodBlocked({ blockedCodPincodes: ["795001"] }, a), true);
  assert.equal(isCodBlocked({ blockedCodStates: ["IN-TN"] }, a), false);
});

test("Indian phone check", () => {
  assert.equal(isIndianPhone("+919876543210"), true);
  assert.equal(isIndianPhone("919876543210"), true);
  assert.equal(isIndianPhone("+91123"), false);
  assert.equal(isIndianPhone("+12125550100"), false);
});
