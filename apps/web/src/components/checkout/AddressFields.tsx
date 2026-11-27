"use client";

/**
 * Delivery address fields shared by /checkout and /checkout/express.
 *
 * There is no country picker: the state select is grouped by country
 * (India, United States, Canada, UAE) and the chosen ISO 3166-2 code implies
 * the country. The page passes that country to CountryContext so prices
 * switch live to the currency that will be charged. The server re-derives
 * the country from the same code and rejects inconsistent addresses.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ADDRESS_COUNTRIES,
  ADDRESS_COUNTRY_NAMES,
  POSTAL_FORMAT_HINT,
  POSTAL_LABEL,
  getSubdivision,
  getSubdivisionsByCountry,
  validateAddressShape,
  type AddressCountryCode,
  type AddressField,
} from "@swago/utils/address";

export interface AddressValue {
  address: string;
  city: string;
  /** ISO 3166-2 code, e.g. "IN-TN" ("" when not chosen). */
  stateCode: string;
  /** PIN / ZIP / postal code ("" for UAE). */
  pincode: string;
}

export type AddressFieldErrors = Partial<Record<AddressField, string>>;

export const EMPTY_ADDRESS: AddressValue = { address: "", city: "", stateCode: "", pincode: "" };

const FLAGS: Record<AddressCountryCode, string> = { IN: "🇮🇳", US: "🇺🇸", CA: "🇨🇦", AE: "🇦🇪" };

/** Country implied by the selected state, or null. */
export function countryFromState(stateCode: string): AddressCountryCode | null {
  return getSubdivision(stateCode)?.country ?? null;
}

/** Client-side (table-free) check; the server repeats it with postal tables. */
export function validateAddressClient(v: AddressValue): AddressFieldErrors {
  const r = validateAddressShape({ address: v.address, city: v.city, stateCode: v.stateCode, postalCode: v.pincode });
  const out: AddressFieldErrors = {};
  for (const i of r.issues) if (!out[i.field]) out[i.field] = i.message;
  return out;
}

/** Maps a server ADDRESS_INVALID response onto field errors. */
export function fieldErrorsFromResponse(body: unknown): AddressFieldErrors | null {
  const b = body as { code?: unknown; fieldErrors?: unknown } | null;
  if (!b || b.code !== "ADDRESS_INVALID" || !Array.isArray(b.fieldErrors)) return null;
  const out: AddressFieldErrors = {};
  for (const raw of b.fieldErrors as Array<{ field?: string; message?: unknown } | null>) {
    const f = raw?.field as AddressField | undefined;
    if (f && !out[f]) out[f] = String(raw?.message || "");
  }
  return out;
}

type InferMatch = { country: AddressCountryCode; exact: boolean; states: Array<{ code: string; name: string }> };

interface Props {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  errors: AddressFieldErrors;
  onErrorsChange: (next: AddressFieldErrors) => void;
  /** Called whenever the implied country changes (null = no state chosen yet). */
  onCountryChange?: (country: AddressCountryCode | null) => void;
}

const inputBase =
  "w-full h-12 px-4 border rounded-md focus:ring-1 focus:ring-[hsl(var(--swago-purple))] outline-none text-sm shadow-sm bg-white";
const inputCls = (bad?: string) =>
  `${inputBase} ${bad ? "border-red-500 bg-red-50 placeholder-red-300" : "border-slate-200"}`;

export default function AddressFields({ value, onChange, errors, onErrorsChange, onCountryChange }: Props) {
  const country = countryFromState(value.stateCode);
  const [suggestions, setSuggestions] = useState<Array<{ code: string; name: string }>>([]);
  const [looking, setLooking] = useState(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    onCountryChange?.(country);
  }, [country, onCountryChange]);

  const set = (patch: Partial<AddressValue>) => {
    const next = { ...valueRef.current, ...patch };
    // UAE has no postal codes
    if (countryFromState(next.stateCode) === "AE") next.pincode = "";
    onChange(next);
    const cleared = { ...errors };
    let changed = false;
    for (const k of Object.keys(patch) as Array<keyof AddressValue>) {
      const field: AddressField = k === "pincode" ? "postalCode" : k === "stateCode" ? "state" : (k as AddressField);
      if (cleared[field]) {
        delete cleared[field];
        changed = true;
      }
      // State change can resolve a postal mismatch and vice versa
      if ((k === "stateCode" || k === "pincode") && (cleared.postalCode || cleared.state)) {
        delete cleared.postalCode;
        delete cleared.state;
        changed = true;
      }
    }
    if (changed) onErrorsChange(cleared);
  };

  const blurCheck = (field: AddressField) => {
    const errs = validateAddressClient(valueRef.current);
    if (errs[field] && errs[field] !== errors[field]) onErrorsChange({ ...errors, [field]: errs[field] });
  };

  // Postal → candidate states (server tables). Suggest only; never overrides a consistent choice.
  useEffect(() => {
    const raw = value.pincode.trim();
    if (raw.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLooking(true);
        const res = await fetch(`/api/address/infer?postal=${encodeURIComponent(raw)}`, { signal: ctrl.signal });
        const data = await res.json();
        const matches: InferMatch[] = data?.matches || [];
        const states = matches.flatMap((m) => m.states);
        const current = valueRef.current.stateCode;
        if (states.length === 1 && (!current || !states.some((s) => s.code === current))) {
          if (!current) set({ stateCode: states[0].code });
          setSuggestions(current ? states : []);
        } else if (current && states.some((s) => s.code === current)) {
          setSuggestions([]);
        } else {
          setSuggestions(states.slice(0, 6));
        }
        // City autofill (only when empty): India Post / Zippopotam, advisory only.
        const exactIN = matches.find((m) => m.country === "IN" && m.exact);
        if (!valueRef.current.city && exactIN && /^[1-9]\d{5}$/.test(raw)) {
          fetch(`https://api.postalpincode.in/pincode/${raw}`, { signal: ctrl.signal })
            .then((r) => r.json())
            .then((d) => {
              const po = d?.[0]?.Status === "Success" ? d[0].PostOffice?.[0] : null;
              const city = [po?.Block, po?.District, po?.Region, po?.Name].find((x: string) => x && x !== "NA");
              if (city && !valueRef.current.city) set({ city });
            })
            .catch(() => {});
        }
        const us = matches.find((m) => m.country === "US");
        if (!valueRef.current.city && us && /^\d{5}/.test(raw)) {
          fetch(`https://api.zippopotam.us/us/${raw.slice(0, 5)}`, { signal: ctrl.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              const city = d?.places?.[0]?.["place name"];
              if (city && !valueRef.current.city) set({ city });
            })
            .catch(() => {});
        }
      } catch {
        /* advisory only */
      } finally {
        setLooking(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode]);

  const groups = useMemo(
    () => ADDRESS_COUNTRIES.map((c) => ({ country: c, states: getSubdivisionsByCountry(c) })),
    []
  );
  const postalLabel = country ? POSTAL_LABEL[country] : "PIN / ZIP / Postal code";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <input
          placeholder="Address (house no., street, area)"
          autoComplete="street-address"
          value={value.address}
          maxLength={300}
          onChange={(e) => set({ address: e.target.value })}
          onBlur={() => blurCheck("address")}
          className={inputCls(errors.address)}
        />
        {errors.address && <p className="text-[10px] text-red-500 font-bold">{errors.address}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {country !== "AE" && (
          <div className="flex flex-col gap-1 relative">
            <input
              placeholder={postalLabel}
              autoComplete="postal-code"
              value={value.pincode}
              maxLength={10}
              onChange={(e) => set({ pincode: e.target.value.toUpperCase().slice(0, 10) })}
              onBlur={() => blurCheck("postalCode")}
              className={`${inputCls(errors.postalCode)} ${looking ? "pr-10" : ""}`}
            />
            {looking && (
              <div className="absolute right-4 top-[24px] -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[hsl(var(--swago-purple))] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {errors.postalCode ? (
              <p className="text-[10px] text-red-500 font-bold">{errors.postalCode}</p>
            ) : country ? (
              <p className="text-[10px] text-slate-400">{POSTAL_FORMAT_HINT[country]}</p>
            ) : null}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <input
            placeholder="City"
            autoComplete="address-level2"
            value={value.city}
            maxLength={100}
            onChange={(e) => set({ city: e.target.value })}
            onBlur={() => blurCheck("city")}
            className={inputCls(errors.city)}
          />
          {errors.city && <p className="text-[10px] text-red-500 font-bold">{errors.city}</p>}
        </div>
        <div className={`flex flex-col gap-1 ${country === "AE" ? "sm:col-span-2" : ""}`}>
          <select
            value={value.stateCode}
            onChange={(e) => {
              setSuggestions([]);
              set({ stateCode: e.target.value });
            }}
            onBlur={() => blurCheck("state")}
            aria-label="State / province / emirate"
            className={`${inputCls(errors.state)} appearance-none`}
          >
            <option value="" disabled>
              State / province / emirate
            </option>
            {groups.map((g) => (
              <optgroup key={g.country} label={`${FLAGS[g.country]} ${ADDRESS_COUNTRY_NAMES[g.country]}`}>
                {g.states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.state && <p className="text-[10px] text-red-500 font-bold">{errors.state}</p>}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">{postalLabel} {value.pincode} matches:</span>
          {suggestions.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => {
                setSuggestions([]);
                set({ stateCode: s.code });
              }}
              className="px-2 py-1 rounded-full border border-[hsl(var(--swago-purple))] text-[hsl(var(--swago-purple))] font-bold hover:bg-purple-50"
            >
              {s.name} ({ADDRESS_COUNTRY_NAMES[getSubdivision(s.code)!.country]})
            </button>
          ))}
        </div>
      )}

      <div className="w-full min-h-10 px-4 py-2 border rounded-md bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
        {country ? (
          <>
            <span className="text-base">{FLAGS[country]}</span>
            <span>
              Delivering to <strong>{ADDRESS_COUNTRY_NAMES[country]}</strong>
              {country === "AE" ? " — UAE addresses don't need a postal code." : "."} Prices below are in the currency you&apos;ll be charged.
            </span>
          </>
        ) : (
          <span>Select your state to see the final price. We deliver to India, the US, Canada and the UAE.</span>
        )}
      </div>
    </div>
  );
}
