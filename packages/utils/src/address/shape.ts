/**
 * Format-level validation that needs no data tables. Runs in the browser for
 * instant feedback and again on the server (as the first step of
 * validateAddress). Client-safe.
 */
import { ADDRESS_COUNTRY_NAMES, type AddressCountryCode, isAddressCountry } from "./countries";
import { getSubdivision, type Subdivision } from "./subdivisions";
import { normalizePostalCode, POSTAL_FORMAT_HINT, POSTAL_LABEL } from "./postal";
import type { AddressIssue } from "./codes";

export interface AddressInput {
  /** Street address (line 1 + line 2). */
  address?: unknown;
  city?: unknown;
  /** Full ISO 3166-2 code from the grouped state select, e.g. "IN-TN". */
  stateCode?: unknown;
  postalCode?: unknown;
  phone?: unknown;
}

export interface AddressShapeResult {
  issues: AddressIssue[];
  subdivision?: Subdivision;
  country?: AddressCountryCode;
  postalCode?: string;
  address: string;
  city: string;
}

const PO_BOX_RE = /\b(p\.?\s*o\.?\s*box|post\s*office\s*box|p\s*o\s*b\b|pobox|postal\s*box)\b/i;

export function looksLikePoBox(text: string): boolean {
  return PO_BOX_RE.test(text);
}

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max + 1) : "";
}

export function validateAddressShape(input: AddressInput): AddressShapeResult {
  const issues: AddressIssue[] = [];
  const address = clean(input.address, 300);
  const city = clean(input.city, 100);

  if (!address) issues.push({ code: "ADDRESS_REQUIRED", field: "address", message: "Enter your street address." });
  else if (address.length < 5 || address.length > 300 || !/[\p{L}\p{N}]/u.test(address))
    issues.push({ code: "ADDRESS_INVALID", field: "address", message: "Enter a complete street address (5–300 characters)." });

  if (!city) issues.push({ code: "CITY_REQUIRED", field: "city", message: "Enter your city." });
  else if (city.length < 2 || city.length > 100 || !/\p{L}/u.test(city))
    issues.push({ code: "CITY_INVALID", field: "city", message: "Enter a valid city name." });

  const rawState = typeof input.stateCode === "string" ? input.stateCode.trim() : "";
  if (!rawState) {
    issues.push({ code: "STATE_REQUIRED", field: "state", message: "Select your state / province / emirate." });
    return { issues, address, city };
  }
  const subdivision = getSubdivision(rawState);
  if (!subdivision || !isAddressCountry(subdivision.country)) {
    issues.push({ code: "STATE_INVALID", field: "state", message: "Select your state from the list. We ship to India, the US, Canada and the UAE." });
    return { issues, address, city };
  }
  const country = subdivision.country;
  const rawPostal = typeof input.postalCode === "string" ? input.postalCode.trim() : "";
  let postalCode: string | undefined;

  if (country === "AE") {
    if (rawPostal) {
      issues.push({
        code: "POSTAL_NOT_USED",
        field: "postalCode",
        message: "UAE addresses don't use postal codes. Clear this field, or check that the emirate is right.",
      });
    } else postalCode = "";
  } else if (!rawPostal) {
    issues.push({ code: "POSTAL_REQUIRED", field: "postalCode", message: `Enter your ${POSTAL_LABEL[country]}.` });
  } else {
    const n = normalizePostalCode(country, rawPostal);
    if (n === null) {
      issues.push({
        code: "POSTAL_FORMAT",
        field: "postalCode",
        message: `That isn't a valid ${ADDRESS_COUNTRY_NAMES[country]} ${POSTAL_LABEL[country]} (${POSTAL_FORMAT_HINT[country]}).`,
      });
    } else postalCode = n;
  }

  return { issues, subdivision, country, postalCode, address, city };
}
