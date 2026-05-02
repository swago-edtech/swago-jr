"use client";

import React, { useEffect, useState } from "react";
import { Product, useSharedContext } from "@/context/SharedContext";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface RelatedProductsCompactProps {
  currentProductId: string;
}

export default function RelatedProductsCompact({ currentProductId }: RelatedProductsCompactProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useSharedContext();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        const data = await response.json();
        if (data.success) {
          // Slice for brevity
          setProducts(data.products.slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRelatedProducts();
  }, [currentProductId]);

  if (loading || products.length === 0) return null;

  return (
    <>
      {products.map((product) => (
        <div
          key={product._id || product.id}
          className="group bg-slate-50 rounded-xl p-1.5 border border-slate-100/50"
        >
          <Link href={`/product/${product.slug || product._id || product.id}`}>
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white mb-1.5 shadow-sm">
              <Image
                src={product.images?.[0] || "/images/placeholder.png"}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </Link>
          <div className="space-y-0.5">
            <h4 className="text-[9px] font-black text-slate-900 leading-tight tracking-tighter">{product.name}</h4>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-[#61498C]">₹{product.price}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="bg-white border border-[#61498C] text-[#61498C] rounded-md p-0.5 hover:bg-[#61498C] hover:text-white transition-all transform active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2 h-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
