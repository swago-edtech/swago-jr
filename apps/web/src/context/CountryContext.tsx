"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { CountryConfig, InternationalPricing } from "@swago/types";
import {
  formatPrice as formatPriceUtil,
  getProductPrice as getProductPriceUtil,
  convertToLocal,
  DEFAULT_INDIA,
  DEFAULT_USD_BROWSE,
} from "@/lib/currency";
import {
  resolveInternationalShipping,
  canShipToCountry,
  UNSUPPORTED_SHIPPING_MESSAGE,
  type InternationalShippingMap,
  type InternationalShippingResult,
} from "@swago/utils";

/** Loose cart-line shape accepted by resolveIntlShipping (cart items / express items). */
export type IntlShippingCartLine = {
  _id?: string | number;
  id?: string | number;
  productId?: string | number;
  slug?: string;
  name?: string;
  quantity: number;
  weight?: number;
  internationalShipping?: InternationalShippingMap | null;
};

type CountryContextType = {
  country: CountryConfig;
  /** Formats an INR amount into the active country currency (exchange-rate path). */
  formatPrice: (amountINR: number) => string;
  /** Formats an amount already in the active country currency (no conversion). */
  formatLocalPrice: (amountLocal: number) => string;
  /** Convert an INR amount into the active local currency via exchange rate. */
  toLocalAmount: (amountINR: number) => number;
  getLocalPrice: (product: {
    price: number;
    originalPrice?: number;
    internationalPricing?: Record<string, InternationalPricing> | Map<string, InternationalPricing>;
  }) => { price: number; originalPrice?: number };
  isInternational: boolean;
  /**
   * True when we fulfill orders to the visitor's country (IN / US / CA / AE).
   * False for browse-only geos that still see USD prices.
   */
  canShip: boolean;
  /** Short message shown when canShip is false. */
  shippingRestrictionMessage: string;
  shippingFee: number;
  shippingFeeLocal: number;
  calculateShippingFee: (cartWeight: number) => number;
  calculateShippingFeeLocal: (cartWeight: number) => number;
  /**
   * INTERNATIONAL ONLY: product fixed shipping (once per line) + config rules on the weight of
   * lines without a fixed fee. Callers must only use this when `isInternational` is true.
   */
  resolveIntlShipping: (items: IntlShippingCartLine[]) => InternationalShippingResult;
  isLoading: boolean;
};

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const STORAGE_KEY = "swago_country";

type StoredCountrySession = {
  country: CountryConfig;
  canShip: boolean;
  detectedCode?: string;
};

/**
 * Browse-only visitors see the same USD prices as a US visitor:
 * product.internationalPricing.USD first, then the US exchange-rate fallback.
 * We mirror the active US CountryConfig currency settings so amounts match exactly.
 */
function buildUsdBrowseConfig(
  detectedCode: string,
  countries: CountryConfig[],
  usFromConfig?: CountryConfig
): CountryConfig {
  const us =
    usFromConfig ||
    countries.find((c) => c.code === "US") ||
    countries.find((c) => String(c.currency || "").toUpperCase() === "USD") ||
    DEFAULT_USD_BROWSE;

  const exchangeRate =
    us.currency === "USD" && Number(us.exchangeRate) > 0
      ? Number(us.exchangeRate)
      : DEFAULT_USD_BROWSE.exchangeRate;

  return {
    // Keep detected ISO so session restore still marks canShip=false
    code: detectedCode && detectedCode !== "IN" ? detectedCode : "XX",
    name: "International",
    // Identical USD display path to US storefront pricing
    currency: "USD",
    currencySymbol: us.currencySymbol || "$",
    phonePrefix: us.phonePrefix || "+",
    exchangeRate,
    shippingFee: 0,
    shippingTiers: [],
    isDefault: false,
    isActive: true,
  };
}

function resolveCountrySession(
  detectedCode: string,
  countries: CountryConfig[]
): StoredCountrySession {
  const code = String(detectedCode || "IN").trim().toUpperCase() || "IN";
  const shippable = canShipToCountry(code);

  if (shippable) {
    const match =
      countries.find((c) => c.code === code) ||
      (code === "IN" ? DEFAULT_INDIA : undefined) ||
      countries.find((c) => c.isDefault) ||
      DEFAULT_INDIA;
    return { country: match, canShip: true, detectedCode: code };
  }

  return {
    country: buildUsdBrowseConfig(code, countries),
    canShip: false,
    detectedCode: code,
  };
}

function readStoredSession(): StoredCountrySession | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Legacy: plain CountryConfig
    if (parsed && parsed.currency && parsed.code && parsed.canShip === undefined) {
      const canShip = canShipToCountry(parsed.code);
      if (!canShip) {
        return {
          country: buildUsdBrowseConfig(String(parsed.code), []),
          canShip: false,
          detectedCode: parsed.code,
        };
      }
      return { country: parsed as CountryConfig, canShip: true, detectedCode: parsed.code };
    }
    if (parsed?.country?.currency && typeof parsed.canShip === "boolean") {
      const session = parsed as StoredCountrySession;
      // Refresh browse-only sessions so USD always mirrors current US product pricing path
      if (!session.canShip) {
        const code = session.detectedCode || session.country?.code || "XX";
        return {
          ...session,
          country: buildUsdBrowseConfig(String(code), [], session.country?.currency === "USD" ? session.country : undefined),
          canShip: false,
        };
      }
      return session;
    }
  } catch (e) {}
  return null;
}

const getInitialSession = (): StoredCountrySession => {
  return readStoredSession() || { country: DEFAULT_INDIA, canShip: true, detectedCode: "IN" };
};

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredCountrySession>(getInitialSession);
  const [isLoading, setIsLoading] = useState(true);

  const country = session.country;
  const canShip = session.canShip;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/geo");
        const data = await res.json();
        const countries: CountryConfig[] = data.countries || [];

        const existing = readStoredSession();
        if (existing) {
          // Re-bind browse-only USD to live US config so product USD prices match US visitors
          const refreshed = existing.canShip
            ? existing
            : {
                ...existing,
                country: buildUsdBrowseConfig(
                  existing.detectedCode || existing.country.code || "XX",
                  countries
                ),
                canShip: false as const,
              };
          setSession(refreshed);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
          setIsLoading(false);
          return;
        }

        let detectedCode = "IN";
        try {
          const geoRes = await fetch("https://ipwho.is/");
          const geoData = await geoRes.json();
          if (geoData.success && geoData.country_code) {
            detectedCode = String(geoData.country_code).toUpperCase();
          }
        } catch (e) {
          console.warn("Browser geo detection failed, defaulting to IN");
        }

        const next = resolveCountrySession(detectedCode, countries);
        setSession(next);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("Country detection failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const formatPrice = useCallback(
    (amountINR: number): string => {
      if (country.currency === "INR") {
        return formatPriceUtil(amountINR, country);
      }
      const local = convertToLocal(amountINR, country.exchangeRate);
      return formatPriceUtil(local, country);
    },
    [country]
  );

  const formatLocalPrice = useCallback(
    (amountLocal: number): string => formatPriceUtil(amountLocal, country),
    [country]
  );

  const toLocalAmount = useCallback(
    (amountINR: number): number => {
      if (country.currency === "INR") return amountINR;
      return convertToLocal(amountINR, country.exchangeRate);
    },
    [country]
  );

  const getLocalPrice = useCallback(
    (product: {
      price: number;
      originalPrice?: number;
      internationalPricing?: Record<string, InternationalPricing> | Map<string, InternationalPricing>;
    }) => {
      return getProductPriceUtil(
        product,
        country.currency,
        country.exchangeRate
      );
    },
    [country]
  );

  // Orderable international geos only — browse-only USD is not a shippable intl checkout.
  const isInternational = canShip && country.code !== "IN";
  const shippingFee = country.shippingFee;
  const shippingFeeLocal = useMemo(
    () =>
      country.currency === "INR"
        ? shippingFee
        : convertToLocal(shippingFee, country.exchangeRate),
    [country, shippingFee]
  );

  const calculateShippingFee = useCallback((cartWeight: number) => {
    if (country.shippingTiers && country.shippingTiers.length > 0) {
      const tier = country.shippingTiers.find(t => cartWeight >= t.minWeight && cartWeight <= t.maxWeight);
      if (tier) return tier.fee;

      const highestTier = [...country.shippingTiers].sort((a, b) => b.maxWeight - a.maxWeight)[0];
      if (highestTier && cartWeight > highestTier.maxWeight) {
         return highestTier.fee;
      }
    }
    return country.shippingFee;
  }, [country]);

  const calculateShippingFeeLocal = useCallback((cartWeight: number) => {
    const feeInINR = calculateShippingFee(cartWeight);
    return country.currency === "INR" ? feeInINR : convertToLocal(feeInINR, country.exchangeRate);
  }, [country, calculateShippingFee]);

  const resolveIntlShipping = useCallback(
    (items: IntlShippingCartLine[]) =>
      resolveInternationalShipping(
        (items || []).map((item) => ({
          productId: item._id ?? item.productId ?? item.id ?? item.slug,
          name: item.name,
          quantity: item.quantity,
          weight: item.weight,
          internationalShipping: item.internationalShipping,
        })),
        country,
        country.currency
      ),
    [country]
  );

  return (
    <CountryContext.Provider
      value={{
        country,
        formatPrice,
        formatLocalPrice,
        toLocalAmount,
        getLocalPrice,
        isInternational,
        canShip,
        shippingRestrictionMessage: UNSUPPORTED_SHIPPING_MESSAGE,
        shippingFee,
        shippingFeeLocal,
        calculateShippingFee,
        calculateShippingFeeLocal,
        resolveIntlShipping,
        isLoading,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx)
    throw new Error("useCountry must be used within a CountryProvider");
  return ctx;
}
