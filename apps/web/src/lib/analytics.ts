// GA4 ecommerce helpers — only fire when analytics consent is granted

import { hasAnalyticsConsent } from "./consent";

export type GaItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function canTrack(): boolean {
  return typeof window !== "undefined" && hasAnalyticsConsent() && typeof window.gtag === "function";
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!canTrack()) return;
  try {
    window.gtag?.("event", eventName, {
      ...params,
      send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined,
    });
  } catch {
    // ignore
  }
}

export function toGaItem(product: {
  _id?: string;
  id?: string | number;
  slug?: string;
  name: string;
  price?: number;
  quantity?: number;
  ageCategory?: string;
  age_category?: string;
}): GaItem {
  const item_id = (product.slug || product._id || product.id || product.name).toString();
  return {
    item_id,
    item_name: product.name,
    price: product.price,
    quantity: product.quantity ?? 1,
    item_category: product.ageCategory || product.age_category,
  };
}

export function trackViewItem(item: GaItem, value?: number): void {
  trackEvent("view_item", {
    currency: "INR",
    value: value ?? item.price ?? 0,
    items: [item],
  });
}

export function trackAddToCart(item: GaItem, value?: number): void {
  trackEvent("add_to_cart", {
    currency: "INR",
    value: value ?? (item.price || 0) * (item.quantity || 1),
    items: [item],
  });
}

export function trackRemoveFromCart(item: GaItem, value?: number): void {
  trackEvent("remove_from_cart", {
    currency: "INR",
    value: value ?? (item.price || 0) * (item.quantity || 1),
    items: [item],
  });
}

export function trackViewCart(items: GaItem[], value: number): void {
  trackEvent("view_cart", {
    currency: "INR",
    value,
    items,
  });
}

export function trackBeginCheckout(items: GaItem[], value: number, coupon?: string): void {
  trackEvent("begin_checkout", {
    currency: "INR",
    value,
    coupon: coupon || undefined,
    items,
  });
}

export function trackAddShippingInfo(items: GaItem[], value: number, shippingTier?: string): void {
  trackEvent("add_shipping_info", {
    currency: "INR",
    value,
    shipping_tier: shippingTier,
    items,
  });
}

export function trackAddPaymentInfo(items: GaItem[], value: number, paymentType?: string): void {
  trackEvent("add_payment_info", {
    currency: "INR",
    value,
    payment_type: paymentType,
    items,
  });
}

export function trackPurchase(opts: {
  transactionId: string;
  value: number;
  items: GaItem[];
  tax?: number;
  shipping?: number;
  coupon?: string;
}): void {
  trackEvent("purchase", {
    transaction_id: opts.transactionId,
    currency: "INR",
    value: opts.value,
    tax: opts.tax || 0,
    shipping: opts.shipping || 0,
    coupon: opts.coupon || undefined,
    items: opts.items,
  });
}

export function trackRefund(opts: {
  transactionId: string;
  value?: number;
  items?: GaItem[];
}): void {
  trackEvent("refund", {
    transaction_id: opts.transactionId,
    currency: "INR",
    value: opts.value,
    items: opts.items,
  });
}

export function trackPaymentFailed(opts?: {
  value?: number;
  paymentType?: string;
  reason?: string;
}): void {
  trackEvent("payment_failed", {
    currency: "INR",
    value: opts?.value,
    payment_type: opts?.paymentType,
    reason: opts?.reason,
  });
}

export function trackCtaClick(ctaId: string, extra?: Record<string, unknown>): void {
  trackEvent("cta_click", { cta_id: ctaId, ...extra });
}

export function trackOutboundClick(url: string, label?: string): void {
  trackEvent("outbound_click", {
    link_url: url,
    link_label: label,
  });
}
