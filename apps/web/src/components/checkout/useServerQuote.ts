"use client";

import { useEffect, useRef, useState } from "react";
import type { AddressValue } from "./AddressFields";
import { validateAddressClient } from "./AddressFields";

/** Server price for the current address + cart (same code path as order creation). */
export interface ServerQuote {
  country: string;
  stateCode: string;
  currency: string;
  currencySymbol: string;
  subtotal: number;
  discount: number;
  swagoMoney: number;
  shipping: number;
  total: number;
  totalINR: number;
}

/** Same line shape the matching order API receives (checkout: cart items; express: {productId, quantity}). */
type QuoteCartLine = Record<string, unknown>;

interface UseServerQuoteArgs {
  mode: "checkout" | "express";
  paymentMethod: "razorpay" | "cod";
  addr: AddressValue;
  phone?: string;
  cart: QuoteCartLine[];
  couponCode?: string | null;
  swagoMoneyRedeemed?: number;
  enabled: boolean;
}

/**
 * Debounced POST /api/checkout/quote. Returns null until the address is complete
 * and the server has priced it; the caller then shows (and sends as expectedTotal)
 * exactly the amount that will be charged. Errors are silent here — the order
 * request itself reports address / price problems.
 */
export function useServerQuote(args: UseServerQuoteArgs): { quote: ServerQuote | null; loading: boolean } {
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  const { mode, paymentMethod, addr, phone, cart, couponCode, swagoMoneyRedeemed, enabled } = args;

  const cartKey = JSON.stringify(cart.map((c) => [c._id ?? c.id ?? c.productId, c.slug, c.price, c.quantity]));
  const addrComplete = enabled && Object.keys(validateAddressClient(addr)).length === 0;

  useEffect(() => {
    if (!addrComplete || cart.length === 0) {
      setQuote(null);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            paymentMethod,
            address: { address: addr.address, city: addr.city, stateCode: addr.stateCode, pincode: addr.pincode, phone },
            cart,
            couponCode: couponCode || null,
            swagoMoneyRedeemed: swagoMoneyRedeemed || 0,
          }),
        });
        const data = await res.json().catch(() => null);
        if (id !== seq.current) return;
        setQuote(res.ok && data?.success ? (data.quote as ServerQuote) : null);
      } catch {
        if (id === seq.current) setQuote(null);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
    // cartKey stands in for cart contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addrComplete, mode, paymentMethod, addr.address, addr.city, addr.stateCode, addr.pincode, phone, cartKey, couponCode, swagoMoneyRedeemed]);

  return { quote, loading };
}
