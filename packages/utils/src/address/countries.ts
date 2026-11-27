/**
 * Countries we ship to. Order matters for UI grouping.
 * Client-safe: no data tables, no Node APIs.
 */
export const ADDRESS_COUNTRIES = ["IN", "US", "CA", "AE"] as const;
export type AddressCountryCode = (typeof ADDRESS_COUNTRIES)[number];

export const ADDRESS_COUNTRY_NAMES: Record<AddressCountryCode, string> = {
  IN: "India",
  US: "United States",
  CA: "Canada",
  AE: "United Arab Emirates",
};

export const ADDRESS_COUNTRY_PHONE_PREFIX: Record<AddressCountryCode, string> = {
  IN: "+91",
  US: "+1",
  CA: "+1",
  AE: "+971",
};

export const ADDRESS_COUNTRY_CURRENCY: Record<AddressCountryCode, string> = {
  IN: "INR",
  US: "USD",
  CA: "CAD",
  AE: "AED",
};

export function isAddressCountry(code: unknown): code is AddressCountryCode {
  return typeof code === "string" && (ADDRESS_COUNTRIES as readonly string[]).includes(code);
}
