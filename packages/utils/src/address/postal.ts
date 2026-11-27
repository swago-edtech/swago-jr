/**
 * Postal-code formats. Client-safe (pure regex, no tables).
 */
import type { AddressCountryCode } from "./countries";

const IN_RE = /^[1-9]\d{5}$/;
const US_RE = /^(\d{5})(?:-?(\d{4}))?$/;
// Canada Post: no D F I O Q U in any position, no W Z as the first letter.
const CA_RE = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]) ?(\d[ABCEGHJ-NPRSTV-Z]\d)$/;

/**
 * Returns the canonical postal code for the country, or null when the
 * format is invalid. AE has no postal codes: empty input -> "" (valid),
 * anything else -> null.
 */
export function normalizePostalCode(country: AddressCountryCode, raw: unknown): string | null {
  const s = typeof raw === "string" ? raw.trim().toUpperCase().replace(/\s+/g, " ") : "";
  switch (country) {
    case "IN": {
      const d = s.replace(/\s/g, "");
      return IN_RE.test(d) ? d : null;
    }
    case "US": {
      const m = US_RE.exec(s.replace(/\s/g, ""));
      if (!m) return null;
      return m[2] ? `${m[1]}-${m[2]}` : m[1];
    }
    case "CA": {
      const m = CA_RE.exec(s);
      return m ? `${m[1]} ${m[2]}` : null;
    }
    case "AE":
      return s === "" ? "" : null;
  }
}

export const POSTAL_LABEL: Record<AddressCountryCode, string> = {
  IN: "PIN code",
  US: "ZIP code",
  CA: "Postal code",
  AE: "Postal code",
};

export const POSTAL_FORMAT_HINT: Record<AddressCountryCode, string> = {
  IN: "6 digits, e.g. 600001",
  US: "5 digits or ZIP+4, e.g. 10001 or 10001-1234",
  CA: "A1A 1A1, e.g. M5V 2T6",
  AE: "Leave empty — UAE addresses have no postal code",
};

/** Countries whose format the raw input matches. Format alone never decides the country. */
export function postalFormatCountries(raw: unknown): AddressCountryCode[] {
  const out: AddressCountryCode[] = [];
  for (const c of ["IN", "US", "CA"] as const) {
    if (typeof raw === "string" && raw.trim() && normalizePostalCode(c, raw) !== null) out.push(c);
  }
  return out;
}
