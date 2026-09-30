"use client";

import { useCountry } from "@/context/CountryContext";
import { useSharedContext, type CartItem } from "@/context/SharedContext";

type ShippingBannerProps = {
  cart: CartItem[];
};

export default function ShippingBanner({ cart }: ShippingBannerProps) {
  const { country, isInternational, formatPrice, formatLocalPrice, resolveIntlShipping } = useCountry();
  const { lastCartRefreshAt } = useSharedContext();

  let text = "Enjoy Free Shipping, on orders above ₹1450";

  if (isInternational) {
    if (cart.length > 0) {
      // Saved cart lines may lack per-product shipping until the first refresh of the session
      if (lastCartRefreshAt === null) return null;
      const feeLocal = resolveIntlShipping(cart).feeLocal;
      if (feeLocal <= 0) return null;
      text = `International Shipping to ${country.name} — ${formatLocalPrice(feeLocal)}`;
    } else {
      if (!country.shippingFee) return null;
      text = `International Shipping to ${country.name} — ${formatPrice(country.shippingFee)} flat rate`;
    }
  }

  return (
    <div className="bg-[hsl(var(--swago-purple))] py-3 text-center">
      <p className="text-white text-[10px] font-[1000] tracking-widest leading-tight">{text}</p>
    </div>
  );
}
