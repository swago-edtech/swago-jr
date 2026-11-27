/**
 * Run: npx tsx --test packages/utils/tests/address.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAddress, inferFromPostal, lookupPostalStates, ADDRESS_DATA_VERSION } from "../src/address-server";
import inPincodes from "../src/address/data/in-pincodes.json";
import { normalizePostalCode, findSubdivisionLegacy, getSubdivision, SUBDIVISIONS, validateAddressShape } from "../src/address-client";

const base = { address: "12 Example Street, Block A", city: "Chennai" };
type Case = [name: string, input: Record<string, unknown>, expect: { ok: boolean; code?: string; flag?: string; country?: string }];

const cases: Case[] = [
  // --- India
  ["IN valid Chennai", { ...base, stateCode: "IN-TN", postalCode: "600001" }, { ok: true, country: "IN" }],
  ["IN pin with spaces normalised", { ...base, stateCode: "IN-TN", postalCode: " 600 001 " }, { ok: true }],
  ["IN pin belongs to other state", { ...base, stateCode: "IN-KA", postalCode: "600001" }, { ok: false, code: "POSTAL_STATE_MISMATCH" }],
  ["IN pin starting with 0", { ...base, stateCode: "IN-TN", postalCode: "060001" }, { ok: false, code: "POSTAL_FORMAT" }],
  ["IN 5-digit pin", { ...base, stateCode: "IN-TN", postalCode: "60001" }, { ok: false, code: "POSTAL_FORMAT" }],
  ["IN APS 9xxxxx unknown prefix", { ...base, stateCode: "IN-DL", postalCode: "999999" }, { ok: false, code: "POSTAL_NOT_FOUND" }],
  ["IN Delhi 110001", { ...base, city: "New Delhi", stateCode: "IN-DL", postalCode: "110001" }, { ok: true }],
  ["IN Ladakh Leh 194101", { ...base, city: "Leh", stateCode: "IN-LA", postalCode: "194101" }, { ok: true }],
  ["IN Leh under J&K rejected", { ...base, city: "Leh", stateCode: "IN-JK", postalCode: "194101" }, { ok: false, code: "POSTAL_STATE_MISMATCH" }],
  ["IN state name instead of code rejected", { ...base, stateCode: "Tamil Nadu", postalCode: "600001" }, { ok: false, code: "STATE_INVALID" }],
  ["IN legacy code IN-TG rejected by API", { ...base, stateCode: "IN-TG", postalCode: "500001" }, { ok: false, code: "STATE_INVALID" }],
  ["IN Telangana 500001", { ...base, city: "Hyderabad", stateCode: "IN-TS", postalCode: "500001" }, { ok: true }],
  ["missing state", { ...base, postalCode: "600001" }, { ok: false, code: "STATE_REQUIRED" }],
  ["unsupported country code", { ...base, stateCode: "GB-ENG", postalCode: "SW1A 1AA" }, { ok: false, code: "STATE_INVALID" }],
  ["missing postal", { ...base, stateCode: "IN-TN" }, { ok: false, code: "POSTAL_REQUIRED" }],
  ["missing city", { address: base.address, stateCode: "IN-TN", postalCode: "600001" }, { ok: false, code: "CITY_REQUIRED" }],
  ["too short address", { address: "ab", city: "Chennai", stateCode: "IN-TN", postalCode: "600001" }, { ok: false, code: "ADDRESS_INVALID" }],
  ["IN +1 phone flagged only", { ...base, stateCode: "IN-TN", postalCode: "600001", phone: "+12125550100" }, { ok: true, flag: "PHONE_COUNTRY_MISMATCH" }],
  // --- US
  ["US valid NYC", { ...base, city: "New York", stateCode: "US-NY", postalCode: "10001" }, { ok: true, country: "US" }],
  ["US ZIP+4", { ...base, city: "New York", stateCode: "US-NY", postalCode: "10001-1234" }, { ok: true }],
  ["US ZIP in other state", { ...base, city: "New York", stateCode: "US-CA", postalCode: "10001" }, { ok: false, code: "POSTAL_STATE_MISMATCH" }],
  ["US Indian pin as ZIP", { ...base, stateCode: "US-NY", postalCode: "600001" }, { ok: false, code: "POSTAL_FORMAT" }],
  ["US military APO", { ...base, stateCode: "US-NY", postalCode: "09001" }, { ok: false, code: "MILITARY_NOT_SUPPORTED" }],
  ["US military 966", { ...base, stateCode: "US-CA", postalCode: "96601" }, { ok: false, code: "MILITARY_NOT_SUPPORTED" }],
  ["US Puerto Rico", { ...base, stateCode: "US-NY", postalCode: "00901" }, { ok: false, code: "TERRITORY_NOT_SUPPORTED" }],
  ["US Guam 969", { ...base, stateCode: "US-HI", postalCode: "96910" }, { ok: false, code: "TERRITORY_NOT_SUPPORTED" }],
  ["US American Samoa", { ...base, stateCode: "US-HI", postalCode: "96799" }, { ok: false, code: "TERRITORY_NOT_SUPPORTED" }],
  ["US Honolulu 968 ok", { ...base, city: "Honolulu", stateCode: "US-HI", postalCode: "96813" }, { ok: true }],
  ["US PO box blocked", { address: "PO Box 123", city: "New York", stateCode: "US-NY", postalCode: "10001" }, { ok: false, code: "PO_BOX_NOT_SUPPORTED" }],
  ["US P.O. Box blocked", { address: "P.O. Box 55, Main St", city: "New York", stateCode: "US-NY", postalCode: "10001" }, { ok: false, code: "PO_BOX_NOT_SUPPORTED" }],
  ["US unknown ZIP3 000", { ...base, stateCode: "US-NY", postalCode: "00012" }, { ok: false, code: "POSTAL_NOT_FOUND" }],
  ["US DC", { ...base, city: "Washington", stateCode: "US-DC", postalCode: "20001" }, { ok: true }],
  // --- Canada
  ["CA valid Toronto", { ...base, city: "Toronto", stateCode: "CA-ON", postalCode: "M5V 2T6" }, { ok: true, country: "CA" }],
  ["CA no space lowercase", { ...base, city: "Toronto", stateCode: "CA-ON", postalCode: "m5v2t6" }, { ok: true }],
  ["CA wrong province", { ...base, city: "Toronto", stateCode: "CA-BC", postalCode: "M5V 2T6" }, { ok: false, code: "POSTAL_STATE_MISMATCH" }],
  ["CA invalid letter D", { ...base, stateCode: "CA-ON", postalCode: "D5V 2T6" }, { ok: false, code: "POSTAL_FORMAT" }],
  ["CA US zip", { ...base, stateCode: "CA-ON", postalCode: "10001" }, { ok: false, code: "POSTAL_FORMAT" }],
  ["CA PO box blocked", { address: "PO Box 9", city: "Toronto", stateCode: "CA-ON", postalCode: "M5V 2T6" }, { ok: false, code: "PO_BOX_NOT_SUPPORTED" }],
  // --- UAE
  ["AE Dubai", { address: "Flat 101, Marina Tower", city: "Dubai", stateCode: "AE-DU" }, { ok: true, country: "AE" }],
  ["AE postal given rejected", { address: "Flat 101, Marina Tower", city: "Dubai", stateCode: "AE-DU", postalCode: "00000" }, { ok: false, code: "POSTAL_NOT_USED" }],
  ["AE city in other emirate", { address: "Flat 101, Marina Tower", city: "Dubai", stateCode: "AE-SH" }, { ok: false, code: "AE_CITY_MISMATCH" }],
  ["AE Al Ain City -> Abu Dhabi", { address: "Villa 3, Street 5", city: "Al Ain", stateCode: "AE-AZ" }, { ok: true }],
  ["AE Dibba Al-Hisn override Sharjah", { address: "Villa 3, Street 5", city: "Dibba Al-Hisn", stateCode: "AE-SH" }, { ok: true }],
  ["AE Khor Fakkan Sharjah", { address: "Villa 3, Street 5", city: "Khawr Fakkan", stateCode: "AE-SH" }, { ok: true }],
  ["AE unknown city flagged", { address: "Villa 3, Street 5", city: "Some New Community", stateCode: "AE-DU" }, { ok: true, flag: "AE_CITY_UNKNOWN" }],
  ["AE PO box allowed+flagged", { address: "P.O. Box 12345, Deira", city: "Dubai", stateCode: "AE-DU" }, { ok: true, flag: "PO_BOX" }],
];

for (const [name, input, exp] of cases) {
  test(name, () => {
    const r = validateAddress(input);
    assert.equal(r.ok, exp.ok, `${name}: ${JSON.stringify(r.errors)}`);
    if (exp.code) assert.ok(r.errors.some((e) => e.code === exp.code), `${name}: expected ${exp.code}, got ${r.errors.map((e) => e.code)}`);
    if (exp.flag) assert.ok(r.flags.includes(exp.flag as never), `${name}: expected flag ${exp.flag}, got ${r.flags}`);
    if (exp.country) assert.equal(r.value?.country, exp.country);
    assert.equal(r.dataVersion, ADDRESS_DATA_VERSION);
  });
}

test("subdivision count = 107 (IN 36, US 51, CA 13, AE 7)", () => {
  const c = (k: string) => SUBDIVISIONS.filter((s) => s.country === k).length;
  assert.deepEqual([c("IN"), c("US"), c("CA"), c("AE")], [36, 51, 13, 7]);
  assert.equal(new Set(SUBDIVISIONS.map((s) => s.code)).size, SUBDIVISIONS.length);
});

test("every IN state has pincodes in the table", () => {
  for (const s of SUBDIVISIONS.filter((x) => x.country === "IN")) {
    assert.ok(typeof (inPincodes as Record<string, string>)[s.code] === "string", s.code);
  }
  assert.deepEqual(lookupPostalStates("IN", "110001"), ["IN-DL"]);
});

test("postal normalisation", () => {
  assert.equal(normalizePostalCode("CA", "k1a0b1"), "K1A 0B1");
  assert.equal(normalizePostalCode("US", "100011234"), "10001-1234");
  assert.equal(normalizePostalCode("AE", ""), "");
  assert.equal(normalizePostalCode("AE", "12345"), null);
});

test("inference never picks a single country for ambiguous digits", () => {
  const r = inferFromPostal("10001");
  assert.deepEqual(r.map((x) => x.country), ["US"]);
  const i = inferFromPostal("600001");
  assert.equal(i[0].country, "IN");
  assert.ok(i[0].stateCodes.includes("IN-TN"));
});

test("legacy lookup for backfill", () => {
  assert.equal(findSubdivisionLegacy("tamil nadu", "IN")?.code, "IN-TN");
  assert.equal(findSubdivisionLegacy("Orissa")?.code, "IN-OD");
  assert.equal(findSubdivisionLegacy("TN", "IN")?.code, "IN-TN");
  assert.equal(findSubdivisionLegacy("Punjab")?.code, "IN-PB");
  assert.equal(findSubdivisionLegacy("Georgia")?.code, "US-GA");
  assert.equal(getSubdivision("in-tn")?.code, "IN-TN");
});

test("shape check is table-free and catches format", () => {
  const r = validateAddressShape({ ...base, stateCode: "US-NY", postalCode: "ABC" });
  assert.equal(r.issues[0].code, "POSTAL_FORMAT");
});
