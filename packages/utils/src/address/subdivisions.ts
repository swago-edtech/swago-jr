/**
 * ISO 3166-2 subdivisions for every country we ship to.
 * The state select is grouped by country, so the chosen state implies the
 * country; the server derives the order's country from this code alone.
 * Client-safe.
 */
import type { AddressCountryCode } from "./countries";

export interface Subdivision {
  /** Full ISO 3166-2 code, e.g. "IN-TN", "US-CA", "CA-ON", "AE-DU". */
  code: string;
  country: AddressCountryCode;
  name: string;
  kind: "state" | "union_territory" | "district" | "province" | "territory" | "emirate";
  /** Older names / ISO codes still seen in legacy data. Used by backfill scripts only. */
  aliases?: string[];
}

const IN: Subdivision[] = [
  { code: "IN-AP", country: "IN", name: "Andhra Pradesh", kind: "state" },
  { code: "IN-AR", country: "IN", name: "Arunachal Pradesh", kind: "state" },
  { code: "IN-AS", country: "IN", name: "Assam", kind: "state" },
  { code: "IN-BR", country: "IN", name: "Bihar", kind: "state" },
  { code: "IN-CG", country: "IN", name: "Chhattisgarh", kind: "state", aliases: ["IN-CT", "Chattisgarh"] },
  { code: "IN-GA", country: "IN", name: "Goa", kind: "state" },
  { code: "IN-GJ", country: "IN", name: "Gujarat", kind: "state" },
  { code: "IN-HR", country: "IN", name: "Haryana", kind: "state" },
  { code: "IN-HP", country: "IN", name: "Himachal Pradesh", kind: "state" },
  { code: "IN-JH", country: "IN", name: "Jharkhand", kind: "state" },
  { code: "IN-KA", country: "IN", name: "Karnataka", kind: "state" },
  { code: "IN-KL", country: "IN", name: "Kerala", kind: "state" },
  { code: "IN-MP", country: "IN", name: "Madhya Pradesh", kind: "state" },
  { code: "IN-MH", country: "IN", name: "Maharashtra", kind: "state" },
  { code: "IN-MN", country: "IN", name: "Manipur", kind: "state" },
  { code: "IN-ML", country: "IN", name: "Meghalaya", kind: "state" },
  { code: "IN-MZ", country: "IN", name: "Mizoram", kind: "state" },
  { code: "IN-NL", country: "IN", name: "Nagaland", kind: "state" },
  { code: "IN-OD", country: "IN", name: "Odisha", kind: "state", aliases: ["IN-OR", "Orissa"] },
  { code: "IN-PB", country: "IN", name: "Punjab", kind: "state" },
  { code: "IN-RJ", country: "IN", name: "Rajasthan", kind: "state" },
  { code: "IN-SK", country: "IN", name: "Sikkim", kind: "state" },
  { code: "IN-TN", country: "IN", name: "Tamil Nadu", kind: "state" },
  { code: "IN-TS", country: "IN", name: "Telangana", kind: "state", aliases: ["IN-TG"] },
  { code: "IN-TR", country: "IN", name: "Tripura", kind: "state" },
  { code: "IN-UP", country: "IN", name: "Uttar Pradesh", kind: "state" },
  { code: "IN-UK", country: "IN", name: "Uttarakhand", kind: "state", aliases: ["IN-UT", "Uttaranchal"] },
  { code: "IN-WB", country: "IN", name: "West Bengal", kind: "state" },
  { code: "IN-AN", country: "IN", name: "Andaman and Nicobar Islands", kind: "union_territory", aliases: ["Andaman & Nicobar Islands", "Andaman & Nicobar"] },
  { code: "IN-CH", country: "IN", name: "Chandigarh", kind: "union_territory" },
  {
    code: "IN-DH",
    country: "IN",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    kind: "union_territory",
    aliases: ["IN-DN", "IN-DD", "Dadra and Nagar Haveli", "Daman and Diu", "Dadra & Nagar Haveli", "Daman & Diu"],
  },
  { code: "IN-DL", country: "IN", name: "Delhi", kind: "union_territory", aliases: ["New Delhi", "NCT of Delhi"] },
  { code: "IN-JK", country: "IN", name: "Jammu and Kashmir", kind: "union_territory", aliases: ["Jammu & Kashmir"] },
  { code: "IN-LA", country: "IN", name: "Ladakh", kind: "union_territory" },
  { code: "IN-LD", country: "IN", name: "Lakshadweep", kind: "union_territory" },
  { code: "IN-PY", country: "IN", name: "Puducherry", kind: "union_territory", aliases: ["Pondicherry"] },
];

const US_NAMES: Array<[string, string]> = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
  ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];
const US: Subdivision[] = [
  ...US_NAMES.map(([c, name]) => ({ code: `US-${c}`, country: "US" as const, name, kind: "state" as const })),
  { code: "US-DC", country: "US", name: "District of Columbia", kind: "district", aliases: ["Washington DC", "Washington, D.C."] },
];

const CA: Subdivision[] = [
  { code: "CA-AB", country: "CA", name: "Alberta", kind: "province" },
  { code: "CA-BC", country: "CA", name: "British Columbia", kind: "province" },
  { code: "CA-MB", country: "CA", name: "Manitoba", kind: "province" },
  { code: "CA-NB", country: "CA", name: "New Brunswick", kind: "province" },
  { code: "CA-NL", country: "CA", name: "Newfoundland and Labrador", kind: "province" },
  { code: "CA-NS", country: "CA", name: "Nova Scotia", kind: "province" },
  { code: "CA-ON", country: "CA", name: "Ontario", kind: "province" },
  { code: "CA-PE", country: "CA", name: "Prince Edward Island", kind: "province" },
  { code: "CA-QC", country: "CA", name: "Quebec", kind: "province", aliases: ["Québec"] },
  { code: "CA-SK", country: "CA", name: "Saskatchewan", kind: "province" },
  { code: "CA-NT", country: "CA", name: "Northwest Territories", kind: "territory" },
  { code: "CA-NU", country: "CA", name: "Nunavut", kind: "territory" },
  { code: "CA-YT", country: "CA", name: "Yukon", kind: "territory" },
];

const AE: Subdivision[] = [
  { code: "AE-AZ", country: "AE", name: "Abu Dhabi", kind: "emirate" },
  { code: "AE-AJ", country: "AE", name: "Ajman", kind: "emirate" },
  { code: "AE-DU", country: "AE", name: "Dubai", kind: "emirate" },
  { code: "AE-FU", country: "AE", name: "Fujairah", kind: "emirate" },
  { code: "AE-RK", country: "AE", name: "Ras Al Khaimah", kind: "emirate" },
  { code: "AE-SH", country: "AE", name: "Sharjah", kind: "emirate" },
  { code: "AE-UQ", country: "AE", name: "Umm Al Quwain", kind: "emirate" },
];

export const SUBDIVISIONS: readonly Subdivision[] = Object.freeze([...IN, ...US, ...CA, ...AE]);

const BY_CODE = new Map(SUBDIVISIONS.map((s) => [s.code, s]));

/** Strict lookup by canonical ISO code. This is the only lookup order APIs use. */
export function getSubdivision(code: unknown): Subdivision | undefined {
  if (typeof code !== "string") return undefined;
  return BY_CODE.get(code.trim().toUpperCase());
}

export function getSubdivisionsByCountry(country: AddressCountryCode): Subdivision[] {
  return SUBDIVISIONS.filter((s) => s.country === country);
}

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Lenient lookup by name, legacy ISO code or alias. ONLY for migration and
 * backfill of historical data — never for accepting new orders.
 * Returns undefined when the input is ambiguous across countries.
 */
export function findSubdivisionLegacy(input: unknown, country?: AddressCountryCode): Subdivision | undefined {
  if (typeof input !== "string" || !input.trim()) return undefined;
  const direct = getSubdivision(input);
  if (direct && (!country || direct.country === country)) return direct;
  const n = norm(input);
  const pool = country ? SUBDIVISIONS.filter((s) => s.country === country) : SUBDIVISIONS;
  const matches = pool.filter(
    (s) =>
      norm(s.name) === n ||
      (s.aliases || []).some((a) => norm(a) === n) ||
      // bare 2-letter code with a known country, e.g. "TN" + IN
      (country !== undefined && s.code.split("-")[1].toLowerCase() === n)
  );
  return matches.length === 1 ? matches[0] : undefined;
}
