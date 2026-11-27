/**
 * Server-only address validation with postal/state lookup tables.
 * Import from "@swago/utils/address-server". Never import from client
 * components: it pulls ~110 KB of JSON tables into the bundle.
 *
 * Contract: the order's country is derived ONLY from the validated address
 * (ISO state code + consistent postal code / city). Client-sent country,
 * currency and exchange rate are never trusted.
 */
import inPincodes from "./data/in-pincodes.json";
import usZip3 from "./data/us-zip3.json";
import caFsa from "./data/ca-fsa.json";
import aeCities from "./data/ae-cities.json";
import versionInfo from "./data/version.json";
import { ADDRESS_COUNTRY_PHONE_PREFIX, type AddressCountryCode } from "./countries";
import { getSubdivision, type Subdivision } from "./subdivisions";
import { looksLikePoBox, validateAddressShape, type AddressInput } from "./shape";
import type { AddressFlag, AddressIssue } from "./codes";
import { POSTAL_LABEL } from "./postal";

export const ADDRESS_DATA_VERSION: string = (versionInfo as { version: string }).version;

// ------------------------------------------------------------ table loading
let inPinIndex: Map<number, string[]> | null = null;
let inPrefixIndex: Map<string, Set<string>> | null = null;

function loadIndia() {
  if (inPinIndex && inPrefixIndex) return { pins: inPinIndex, prefixes: inPrefixIndex };
  const pins = new Map<number, string[]>();
  const prefixes = new Map<string, Set<string>>();
  for (const [state, ranges] of Object.entries(inPincodes as Record<string, string>)) {
    for (const part of ranges.split(",")) {
      const [a, b] = part.split("-").map(Number);
      for (let p = a; p <= (b ?? a); p++) {
        const list = pins.get(p);
        if (list) list.push(state);
        else pins.set(p, [state]);
        const pre = String(p).slice(0, 3);
        if (!prefixes.has(pre)) prefixes.set(pre, new Set());
        prefixes.get(pre)!.add(state);
      }
    }
  }
  inPinIndex = pins;
  inPrefixIndex = prefixes;
  return { pins, prefixes };
}

const US_TABLE = (usZip3 as { zip3: Record<string, string[]>; military: string[] }).zip3;
const US_MILITARY_DATA = new Set((usZip3 as { military: string[] }).military);
const CA_TABLE = caFsa as Record<string, string[]>;
const AE_TABLE = aeCities as Record<string, string[]>;

// Fixed rules (independent of data coverage).
const US_MILITARY_ZIP3 = new Set(["090", "091", "092", "093", "094", "095", "096", "097", "098", "340", "962", "963", "964", "965", "966"]);
const US_TERRITORY_ZIP3 = new Set(["006", "007", "008", "009", "969"]);
const US_TERRITORY_ZIP5 = new Set(["96799"]); // American Samoa

const CA_FIRST_LETTER: Record<string, string[]> = {
  A: ["CA-NL"], B: ["CA-NS"], C: ["CA-PE"], E: ["CA-NB"], G: ["CA-QC"], H: ["CA-QC"], J: ["CA-QC"],
  K: ["CA-ON"], L: ["CA-ON"], M: ["CA-ON"], N: ["CA-ON"], P: ["CA-ON"], R: ["CA-MB"], S: ["CA-SK"],
  T: ["CA-AB"], V: ["CA-BC"], X: ["CA-NT", "CA-NU"], Y: ["CA-YT"],
};

export function normalizeAeCity(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bcity\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------------ lookups
/** State codes the postal code belongs to according to the tables ([] = unknown). */
export function lookupPostalStates(country: AddressCountryCode, postalCode: string): string[] {
  switch (country) {
    case "IN": {
      const { pins } = loadIndia();
      return pins.get(Number(postalCode)) ?? [];
    }
    case "US":
      return US_TABLE[postalCode.slice(0, 3)] ?? [];
    case "CA":
      return CA_TABLE[postalCode.slice(0, 3)] ?? [];
    default:
      return [];
  }
}

export interface PostalInference {
  country: AddressCountryCode;
  stateCodes: string[];
  /** true when the postal code itself is in the table, false when only its prefix is */
  exact: boolean;
}

/**
 * Candidate states for a raw postal code across all supported countries.
 * Used for UI autofill only; the order's country still comes from the state
 * the customer confirms.
 */
export function inferFromPostal(raw: string): PostalInference[] {
  const s = (raw || "").trim().toUpperCase();
  const out: PostalInference[] = [];
  const inMatch = /^[1-9]\d{5}$/.test(s);
  if (inMatch) {
    const { pins, prefixes } = loadIndia();
    const exact = pins.get(Number(s));
    if (exact) out.push({ country: "IN", stateCodes: [...exact], exact: true });
    else {
      const pre = prefixes.get(s.slice(0, 3));
      if (pre) out.push({ country: "IN", stateCodes: [...pre], exact: false });
    }
  }
  const us = /^(\d{5})(?:-?\d{4})?$/.exec(s.replace(/\s/g, ""));
  if (us) {
    const z3 = us[1].slice(0, 3);
    const st = US_TABLE[z3];
    if (st && !US_MILITARY_ZIP3.has(z3) && !US_TERRITORY_ZIP3.has(z3)) out.push({ country: "US", stateCodes: [...st], exact: true });
  }
  const ca = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])/.exec(s.replace(/\s/g, ""));
  if (ca) {
    const st = CA_TABLE[ca[1]];
    if (st) out.push({ country: "CA", stateCodes: [...st], exact: true });
    else if (CA_FIRST_LETTER[ca[1][0]]) out.push({ country: "CA", stateCodes: [...CA_FIRST_LETTER[ca[1][0]]], exact: false });
  }
  return out;
}

// ------------------------------------------------------------ validation
export interface ValidatedAddress {
  country: AddressCountryCode;
  stateCode: string;
  stateName: string;
  postalCode: string;
  address: string;
  city: string;
}

export interface AddressValidationResult {
  ok: boolean;
  /** Present whenever the state code itself is valid (even if other checks failed). */
  subdivision?: Subdivision;
  value?: ValidatedAddress;
  errors: AddressIssue[];
  flags: AddressFlag[];
  dataVersion: string;
}

function names(codes: string[]): string {
  return codes.map((c) => getSubdivision(c)?.name || c).join(" / ");
}

function mismatch(postalLabel: string, postal: string, expected: string[], chosen: Subdivision): AddressIssue {
  return {
    code: "POSTAL_STATE_MISMATCH",
    field: "postalCode",
    message: `${postalLabel} ${postal} belongs to ${names(expected)}, not ${chosen.name}. Check the ${postalLabel} or the state.`,
  };
}

function phoneCountryMismatch(country: AddressCountryCode, phone: unknown): boolean {
  if (typeof phone !== "string" || !phone.trim().startsWith("+")) return false;
  const digits = phone.replace(/[^\d+]/g, "");
  return !digits.startsWith(ADDRESS_COUNTRY_PHONE_PREFIX[country]);
}

export function validateAddress(input: AddressInput): AddressValidationResult {
  const shape = validateAddressShape(input);
  const errors: AddressIssue[] = [...shape.issues];
  const flags: AddressFlag[] = [];
  const base = { subdivision: shape.subdivision, dataVersion: ADDRESS_DATA_VERSION };
  const sub = shape.subdivision;
  const country = shape.country;

  if (!sub || !country) return { ok: false, errors, flags, ...base };

  const postal = shape.postalCode;
  const label = POSTAL_LABEL[country];

  if (postal !== undefined && postal !== "") {
    if (country === "IN") {
      const { pins, prefixes } = loadIndia();
      const exact = pins.get(Number(postal));
      if (exact) {
        if (!exact.includes(sub.code)) errors.push(mismatch(label, postal, exact, sub));
      } else {
        const pre = prefixes.get(postal.slice(0, 3));
        if (!pre) {
          errors.push({ code: "POSTAL_NOT_FOUND", field: "postalCode", message: `PIN code ${postal} doesn't exist. Check the PIN code.` });
        } else if (!pre.has(sub.code)) {
          errors.push(mismatch(label, postal, [...pre], sub));
        } else flags.push("POSTAL_UNKNOWN");
      }
    } else if (country === "US") {
      const z3 = postal.slice(0, 3);
      if (US_MILITARY_ZIP3.has(z3) || US_MILITARY_DATA.has(z3)) {
        errors.push({ code: "MILITARY_NOT_SUPPORTED", field: "postalCode", message: "We can't ship to APO/FPO/DPO military addresses yet." });
      } else if (US_TERRITORY_ZIP3.has(z3) || US_TERRITORY_ZIP5.has(postal.slice(0, 5))) {
        errors.push({ code: "TERRITORY_NOT_SUPPORTED", field: "postalCode", message: "We can't ship to US territories yet (Puerto Rico, USVI, Guam, American Samoa, etc.)." });
      } else {
        const st = US_TABLE[z3];
        if (!st) errors.push({ code: "POSTAL_NOT_FOUND", field: "postalCode", message: `ZIP code ${postal} doesn't exist. Check the ZIP code.` });
        else if (!st.includes(sub.code)) errors.push(mismatch(label, postal, st, sub));
      }
    } else if (country === "CA") {
      const fsa = postal.slice(0, 3);
      const byLetter = CA_FIRST_LETTER[fsa[0]] || [];
      const known = CA_TABLE[fsa];
      if (known) {
        if (!known.includes(sub.code)) errors.push(mismatch(label, postal, known, sub));
      } else if (!byLetter.includes(sub.code)) {
        errors.push(mismatch(label, postal, byLetter, sub));
      } else flags.push("POSTAL_UNKNOWN");
    }
  }

  if (country === "AE" && shape.city) {
    const key = normalizeAeCity(shape.city);
    const emirates = AE_TABLE[key];
    if (!emirates) flags.push("AE_CITY_UNKNOWN");
    else if (!emirates.includes(sub.code)) {
      errors.push({
        code: "AE_CITY_MISMATCH",
        field: "city",
        message: `${shape.city} is in ${names(emirates)}, not ${sub.name}. Check the city or the emirate.`,
      });
    }
  }

  if (shape.address && looksLikePoBox(shape.address)) {
    if (country === "US" || country === "CA") {
      errors.push({ code: "PO_BOX_NOT_SUPPORTED", field: "address", message: "We can't deliver to PO boxes in the US or Canada. Enter a street address." });
    } else if (country === "AE") {
      // P.O. Box is part of normal UAE addressing; accepted and recorded.
      flags.push("PO_BOX");
    }
  }

  if (phoneCountryMismatch(country, input.phone)) flags.push("PHONE_COUNTRY_MISMATCH");

  if (errors.length > 0) return { ok: false, errors, flags, ...base };
  return {
    ok: true,
    errors,
    flags,
    ...base,
    value: {
      country,
      stateCode: sub.code,
      stateName: sub.name,
      postalCode: postal ?? "",
      address: shape.address,
      city: shape.city,
    },
  };
}
