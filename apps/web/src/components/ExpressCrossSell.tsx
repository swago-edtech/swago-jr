"use client";

import Image from "next/image";
import { useCountry } from "@/context/CountryContext";

interface CrossSellProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  slug: string;
  availableStock: number;
  label?: string;
  ageCategory?: string;
  internationalPricing?: Record<string, { price: number; originalPrice?: number }>;
}

interface ExpressCrossSellProps {
  products: CrossSellProduct[];
  onAddProduct: (product: CrossSellProduct) => void;
  cartProductIds: string[];
}

export default function ExpressCrossSell({ products, onAddProduct, cartProductIds }: ExpressCrossSellProps) {
  const { formatLocalPrice, getLocalPrice } = useCountry();
  if (!products || products.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest px-1 md:px-0">
        You might also like
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-3 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-col md:overflow-visible md:space-y-2 md:pb-0 md:gap-0">
        {products.map((product) => {
          const isInCart = cartProductIds.includes(product._id.toString());
          const local = getLocalPrice(product);
          const discount = local.originalPrice
            ? Math.round(((local.originalPrice - local.price) / local.originalPrice) * 100)
            : 0;

          return (
            <div
              key={product._id}
              className="flex flex-col gap-1.5 p-2 bg-white border border-slate-100 rounded-xl transition-all group w-[105px] flex-shrink-0 snap-start md:w-auto md:flex-row md:items-center shadow-sm"
            >
              {/* Product Image */}
              <div className="relative w-14 h-14 mx-auto md:w-14 md:h-14 bg-slate-50 rounded-lg flex-shrink-0 overflow-hidden">
                <Image
                  src={product.images?.[0] || "/images/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 56px, 56px"
                />
                {product.label && (
                  <div className="absolute top-0 left-0 bg-[hsl(var(--swago-purple))] text-white text-[5px] md:text-[6px] font-black px-1 py-[2px] rounded-br-lg md:rounded-br-md uppercase tracking-wider">
                    {product.label}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between text-center md:text-left">
                <h4 className="text-[10px] md:text-[13px] font-bold text-[#0f172a] leading-tight line-clamp-1 md:line-clamp-2 mb-0.5" title={product.name}>
                  {product.name}
                </h4>
                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-1">
                  <span className="text-[11px] md:text-sm font-black text-[#0f172a]">{formatLocalPrice(local.price)}</span>
                  {local.originalPrice && local.originalPrice > local.price && (
                    <>
                      <span className="hidden md:inline-block text-[9px] text-[#94a3b8] line-through">{formatLocalPrice(local.originalPrice)}</span>
                      <span className="text-[9px] font-black text-[#10b981]">{discount}% off</span>
                    </>
                  )}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => !isInCart && onAddProduct(product)}
                disabled={isInCart}
                className={`w-full md:w-[120px] px-1 py-1.5 md:py-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0 text-center ${
                  isInCart
                    ? "bg-[#10b981]/10 text-[#10b981] cursor-default"
                    : "bg-[hsl(var(--swago-purple))] text-white hover:opacity-90 active:scale-95 shadow-sm"
                }`}
              >
                {isInCart ? "✓ Added" : "+ Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
