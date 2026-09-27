"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useCountry } from "@/context/CountryContext";

interface ExpressCartItem {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  slug?: string;
  quantity: number;
  internationalPricing?: Record<string, { price: number; originalPrice?: number }>;
  weight?: number;
}

interface ExpressOrderSummaryProps {
  items: ExpressCartItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shippingFee: number;
  total: number;
  onIncreaseQty: (id: string) => void;
  onDecreaseQty: (id: string) => void;
  onRemoveItem: (id: string) => void;
  paymentMethod: "razorpay" | "cod";
  hideItems?: boolean;
  hideBreakdown?: boolean;
}

export default function ExpressOrderSummary({
  items,
  subtotal,
  discount,
  couponCode,
  shippingFee,
  total,
  onIncreaseQty,
  onDecreaseQty,
  onRemoveItem,
  paymentMethod,
  hideItems,
  hideBreakdown,
}: ExpressOrderSummaryProps) {
  const {
    formatLocalPrice,
    getLocalPrice,
    toLocalAmount,
    country,
    isInternational,
    calculateShippingFeeLocal,
  } = useCountry();
  const currency = country?.currency || "INR";

  const localSubtotal = useMemo(
    () => items.reduce((s, item) => s + getLocalPrice(item).price * item.quantity, 0),
    [items, getLocalPrice]
  );
  const localDiscount = toLocalAmount(discount || 0);
  const localShipping = isInternational
    ? calculateShippingFeeLocal(
        items.reduce((s, item) => s + (item.weight || 0) * item.quantity, 0)
      )
    : shippingFee;
  const localTotal = Math.max(0, localSubtotal - localDiscount + localShipping);

  return (
    <div className="space-y-3">
      {!hideItems && (
        <div className="space-y-2">
          {items.map((item) => {
            const line = getLocalPrice(item).price * item.quantity;
            return (
              <div key={item._id} className="flex items-center gap-3">
                <div className="relative w-16 h-16 bg-[#f8fafc] rounded-xl flex-shrink-0">
                  <Image
                    src={item.images?.[0] || "/images/placeholder.png"}
                    alt={item.name}
                    fill
                    className="object-cover rounded-xl"
                    sizes="64px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-[#0f172a] leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => onDecreaseQty(item._id)}
                      className="w-5 h-5 rounded-md bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-xs font-bold text-[#64748b] transition-colors"
                    >
                      −
                    </button>
                    <span className="text-[11px] font-black text-[#0f172a] tabular-nums w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onIncreaseQty(item._id)}
                      className="w-5 h-5 rounded-md bg-[#f1f5f9] hover:bg-[#e2e8f0] flex items-center justify-center text-xs font-bold text-[#64748b] transition-colors"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemoveItem(item._id)}
                      className="ml-2 text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 font-bold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="text-sm font-bold text-[#0f172a] flex-shrink-0">
                  {formatLocalPrice(line)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hideItems && !hideBreakdown && <div className="border-t border-[#e2e8f0]" />}

      {!hideBreakdown && (
        <div className="space-y-2 text-[13px]">
          <div className="flex justify-between text-[#64748b]">
            <span className="font-medium">Subtotal</span>
            <span className="font-bold text-[#0f172a]">
              {formatLocalPrice(localSubtotal || toLocalAmount(subtotal))}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-[#10b981] font-bold">
              <span>Discount {couponCode && `(${couponCode})`}</span>
              <span>−{formatLocalPrice(localDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#64748b]">
            <span className="font-medium">
              Shipping {paymentMethod === "cod" ? "(COD)" : "(Online)"}
            </span>
            {localShipping === 0 ? (
              <span className="text-[10px] font-black text-[#10b981] tracking-widest uppercase">
                FREE
              </span>
            ) : (
              <span className="font-bold text-[#0f172a]">{formatLocalPrice(localShipping)}</span>
            )}
          </div>

          <div className="pt-3 border-t border-[#e2e8f0] flex justify-between items-baseline">
            <h3 className="text-[15px] font-black text-[#0f172a] uppercase tracking-tight">Total</h3>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-[#94a3b8] uppercase font-black tracking-widest">
                {currency}
              </span>
              <span className="text-2xl font-black text-[#0f172a]">
                {formatLocalPrice(localTotal || toLocalAmount(total))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
