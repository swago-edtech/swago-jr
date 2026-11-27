// Server-only module (pulls address lookup tables): import only from API routes / server code.
/**
 * Server-side address resolution for every order-creating route.
 *
 * The validated address is the ONLY source of the order's country (and so
 * its currency, prices and shipping). Client-sent country / currency /
 * exchangeRate fields are ignored.
 *
 * ADDRESS_VALIDATION_MODE:
 *   enforce (default) — any address error rejects the order with 400.
 *   shadow            — postal/city consistency errors are logged and the order
 *                       proceeds with flag SHADOW_WOULD_REJECT. A missing or
 *                       invalid state still rejects, because without it the
 *                       country (and the price) cannot be derived.
 */
import {
  validateAddress,
  normalizePostalCode,
  type AddressCountryCode,
  type AddressFlag,
  type AddressIssue,
} from "@swago/utils/address-server";
import { resolveServerIntlCountry } from "./international-server";
import { INDIA_PRICING_COUNTRY, type PricingCountry } from "./order-pricing";

export type AddressValidationMode = "enforce" | "shadow";

export function getAddressValidationMode(): AddressValidationMode {
  return String(process.env.ADDRESS_VALIDATION_MODE || "").trim().toLowerCase() === "shadow" ? "shadow" : "enforce";
}

export interface OrderAddressInput {
  address?: unknown;
  city?: unknown;
  stateCode?: unknown;
  /** India calls it pincode; we accept either key. */
  pincode?: unknown;
  postalCode?: unknown;
  phone?: unknown;
}

export interface ResolvedOrderAddress {
  country: AddressCountryCode;
  stateCode: string;
  stateName: string;
  postalCode: string;
  address: string;
  city: string;
  flags: AddressFlag[];
  dataVersion: string;
}

export interface AddressRejection {
  status: 400;
  body: {
    success: false;
    error: string;
    code: "ADDRESS_INVALID";
    fieldErrors: Array<Pick<AddressIssue, "field" | "code" | "message">>;
  };
}

export type ResolveOrderAddressResult =
  | { ok: true; address: ResolvedOrderAddress }
  | ({ ok: false } & AddressRejection);

function reject(errors: AddressIssue[]): { ok: false } & AddressRejection {
  return {
    ok: false,
    status: 400,
    body: {
      success: false,
      error: errors[0]?.message || "Please check your address.",
      code: "ADDRESS_INVALID",
      fieldErrors: errors.map(({ field, code, message }) => ({ field, code, message })),
    },
  };
}

export function resolveOrderAddress(
  input: OrderAddressInput,
  context: string,
  mode: AddressValidationMode = getAddressValidationMode()
): ResolveOrderAddressResult {
  const postal = input.postalCode ?? input.pincode;
  const result = validateAddress({
    address: input.address,
    city: input.city,
    stateCode: input.stateCode,
    postalCode: postal,
    phone: input.phone,
  });

  if (result.flags.length) {
    console.info(`[address:${context}] accepted-with-flags`, { flags: result.flags, state: result.subdivision?.code });
  }
  if (result.ok && result.value) {
    return { ok: true, address: { ...result.value, flags: result.flags, dataVersion: result.dataVersion } };
  }

  const codes = result.errors.map((e) => e.code);
  console.warn(`[address:${context}] ${mode === "shadow" ? "would-reject" : "rejected"}`, { codes, state: result.subdivision?.code });

  const sub = result.subdivision;
  // Shadow mode may only bypass consistency checks; a usable state is mandatory.
  if (mode === "shadow" && sub) {
    const rawPostal = typeof postal === "string" ? postal.trim() : "";
    const shapeOnly = result.errors.filter((e) => ["ADDRESS_REQUIRED", "CITY_REQUIRED", "POSTAL_REQUIRED"].includes(e.code));
    if (shapeOnly.length === 0) {
      return {
        ok: true,
        address: {
          country: sub.country,
          stateCode: sub.code,
          stateName: sub.name,
          postalCode: normalizePostalCode(sub.country, rawPostal) ?? rawPostal.slice(0, 12),
          address: String(input.address || "").trim().slice(0, 300),
          city: String(input.city || "").trim().slice(0, 100),
          flags: [...result.flags, "SHADOW_WOULD_REJECT"],
          dataVersion: result.dataVersion,
        },
      };
    }
  }
  return reject(result.errors);
}

export type PricingCountryResult =
  | { ok: true; country: PricingCountry }
  | { ok: false; status: 400; error: string; code: "COUNTRY_NOT_SUPPORTED" };

/** Currency + exchange rate for the address country (InternationalConfig for non-IN). */
export async function resolvePricingCountry(code: AddressCountryCode): Promise<PricingCountryResult> {
  if (code === "IN") return { ok: true, country: INDIA_PRICING_COUNTRY };
  const r = await resolveServerIntlCountry(code);
  if (!r.ok) return { ok: false, status: 400, error: r.error, code: "COUNTRY_NOT_SUPPORTED" };
  return {
    ok: true,
    country: {
      code,
      currency: r.country.currency,
      exchangeRate: r.country.exchangeRate,
      currencySymbol: r.country.currencySymbol,
      shippingFee: r.country.shippingFee,
      shippingTiers: r.country.shippingTiers as PricingCountry["shippingTiers"],
    },
  };
}

/** Promotion COD block lists now hold ISO state codes (legacy names still matched). */
export function isCodBlocked(
  promotion: { blockedCodStates?: string[]; blockedCodPincodes?: string[] } | null | undefined,
  address: Pick<ResolvedOrderAddress, "stateCode" | "stateName" | "postalCode">
): boolean {
  const states = (promotion?.blockedCodStates || []).map((s) => String(s).trim().toLowerCase());
  const stateBlocked = states.includes(address.stateCode.toLowerCase()) || states.includes(address.stateName.toLowerCase());
  const pinBlocked = (promotion?.blockedCodPincodes || []).map((p) => String(p).trim()).includes(address.postalCode);
  return stateBlocked || pinBlocked;
}

/** Indian mobile in E.164-ish form (+91 followed by 10 digits starting 6-9). */
export function isIndianPhone(phone: unknown): boolean {
  if (typeof phone !== "string") return false;
  const d = phone.replace(/[\s-]/g, "");
  return /^\+91[6-9]\d{9}$/.test(d) || /^91[6-9]\d{9}$/.test(d);
}
