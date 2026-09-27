import type { CountryConfig, InternationalPricing } from "@swago/types";

export function formatPrice(
  amountInLocalCurrency: number,
  config: CountryConfig
): string {
  const rounded =
    config.currency === "INR"
      ? Math.round(amountInLocalCurrency)
      : Math.round(amountInLocalCurrency * 100) / 100;

  return `${config.currencySymbol}${rounded.toLocaleString("en-IN", {
    minimumFractionDigits: config.currency === "INR" ? 0 : 2,
    maximumFractionDigits: config.currency === "INR" ? 0 : 2,
  })}`;
}

export function convertToLocal(amountINR: number, exchangeRate: number): number {
  return Math.round(amountINR * exchangeRate * 100) / 100;
}

export function convertToINR(amountLocal: number, exchangeRate: number): number {
  if (exchangeRate === 0) return 0;
  return Math.round(amountLocal / exchangeRate);
}

export function getProductPrice(
  product: {
    price: number;
    originalPrice?: number;
    internationalPricing?: Record<string, InternationalPricing> | Map<string, InternationalPricing>;
  },
  currency: string,
  exchangeRate: number
): { price: number; originalPrice?: number } {
  if (currency === "INR") {
    return {
      price: product.price,
      originalPrice: product.originalPrice,
    };
  }

  let intlPricing: InternationalPricing | undefined;

  if (product.internationalPricing) {
    if (product.internationalPricing instanceof Map) {
      intlPricing =
        product.internationalPricing.get(currency) ||
        product.internationalPricing.get(currency.toUpperCase());
    } else if (typeof product.internationalPricing === "object") {
      const map = product.internationalPricing as Record<string, InternationalPricing>;
      intlPricing = map[currency] || map[currency.toUpperCase()];
    }
  }

  if (intlPricing?.price) {
    return {
      price: intlPricing.price,
      originalPrice: intlPricing.originalPrice,
    };
  }

  return {
    price: convertToLocal(product.price, exchangeRate),
    originalPrice: product.originalPrice
      ? convertToLocal(product.originalPrice, exchangeRate)
      : undefined,
  };
}

const DEFAULT_INDIA: CountryConfig = {
  code: "IN",
  name: "India",
  currency: "INR",
  currencySymbol: "₹",
  phonePrefix: "+91",
  shippingFee: 0,
  isDefault: true,
  isActive: true,
  exchangeRate: 1,
};

export { DEFAULT_INDIA };
