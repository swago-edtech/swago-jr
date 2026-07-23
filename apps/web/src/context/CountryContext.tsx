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
} from "@/lib/currency";

type CountryContextType = {
  country: CountryConfig;
  formatPrice: (amountINR: number) => string;
  getLocalPrice: (product: {
    price: number;
    originalPrice?: number;
    internationalPricing?: Record<string, InternationalPricing> | Map<string, InternationalPricing>;
  }) => { price: number; originalPrice?: number };
  isInternational: boolean;
  shippingFee: number;
  shippingFeeLocal: number;
  calculateShippingFee: (cartWeight: number) => number;
  calculateShippingFeeLocal: (cartWeight: number) => number;
  isLoading: boolean;
};

const CountryContext = createContext<CountryContextType | undefined>(undefined);

const STORAGE_KEY = "swago_country";

const getInitialCountry = (): CountryConfig => {
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }
  return DEFAULT_INDIA;
};

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<CountryConfig>(getInitialCountry);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setCountryState(JSON.parse(saved));
            setIsLoading(false);
            return;
          } catch (e) {}
        }

        const res = await fetch("/api/geo");
        const data = await res.json();
        const countries: CountryConfig[] = data.countries || [];

        let detectedCode = "IN";
        try {
          const geoRes = await fetch("https://ipwho.is/");
          const geoData = await geoRes.json();
          if (geoData.success && geoData.country_code) {
            detectedCode = geoData.country_code.toUpperCase();
          }
        } catch (e) {
          console.warn("Browser geo detection failed, defaulting to IN");
        }

        const detected =
          countries.find((c) => c.code === detectedCode) ||
          countries.find((c) => c.isDefault) ||
          DEFAULT_INDIA;

        setCountryState(detected);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(detected));
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

  const isInternational = country.code !== "IN";
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

  return (
    <CountryContext.Provider
      value={{
        country,
        formatPrice,
        getLocalPrice,
        isInternational,
        shippingFee,
        shippingFeeLocal,
        calculateShippingFee,
        calculateShippingFeeLocal,
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
