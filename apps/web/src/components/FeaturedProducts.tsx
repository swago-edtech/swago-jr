"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/context/SharedContext';

export default function FeaturedProducts() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();

        if (data.success) {
          setDbProducts(data.products);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Use more products for sliding if possible
  const featured = dbProducts.slice(0, 6);

  // ✅ Helper function to get unique key
  type ProductLike = Product | {
    id?: number;
    _id?: string;
    [key: string]: unknown;
  };

  const getProductKey = (product: ProductLike): string => {
    return product._id || ('id' in product ? product.id?.toString() : undefined) || Math.random().toString();
  };

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-white overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-3 uppercase tracking-tight text-slate-900">
            NEW <span className="text-[hsl(var(--swago-purple))]">ARRIVALS</span>
          </h2>
          <p className="text-slate-500 font-medium mb-12">Loading latest offerings...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-white overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-3 uppercase tracking-tight text-slate-900">
          NEW <span className="text-[hsl(var(--swago-purple))]">ARRIVALS</span>
        </h2>
        <p className="text-slate-500 font-medium mb-12 text-lg">
          Our latest offerings
        </p>

        {/* Horizontal Scroll Area */}
        <div className="relative mb-8">
          {/* 📱 Mobile: 82% card width + snap-start for a perfect ~15% peek at the next card */}
          <div className="flex overflow-x-auto gap-5 pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth">
            {/* Left Spacer to align first card with padding-left */}
            <div className="flex-none w-6" />

            {featured.map((product) => (
              <div
                key={getProductKey(product)}
                className="flex-none w-[75vw] md:w-[320px] snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}

            {/* Right Spacer for scroll end breathing room */}
            <div className="flex-none w-6" />
          </div>

          {/* Subtle fade indicators for scroll */}
          <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none md:hidden" />
          <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
        </div>

        {/* View All Button */}
        <div className="mt-4">
          <Link
            href="/products"
            className="inline-block bg-[hsl(var(--swago-purple))] transition-all duration-300 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-2xl shadow-xl shadow-purple-100"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
