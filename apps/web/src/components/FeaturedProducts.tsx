"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
// ========================================
// 🔴 TEMPORARY: Remove this import after full migration
import { products as hardcodedProducts } from '@swago/utils';
// ========================================
import ProductCard from '@/components/ProductCard';
import { Product } from '@/context/SharedContext';

export default function FeaturedProducts() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ========================================
        // ✅ KEEP: Fetch products from database
        const res = await fetch('/api/products?featured=true');
        const data = await res.json();
        
        if (data.success) {
          setDbProducts(data.products);
        }
        // ========================================
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ========================================
  // 🔴 TEMPORARY: Merge hardcoded + DB products
  // After migration, replace with:
  // const featured = dbProducts.slice(0, 3);
  const allProducts = [...hardcodedProducts, ...dbProducts];
  const featured = allProducts.slice(0, 3);
  // ========================================

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
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4 uppercase">
            Our Most <span className="text-[hsl(var(--swago-purple))]">Popular</span> Kits
          </h2>
          <p className="text-slate-600 mb-12">Loading featured products...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4 uppercase">
          Our Most <span className="text-[hsl(var(--swago-purple))]">Popular</span> Kits
        </h2>
        <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
          A glimpse of our top-selling kits, loved by parents and kids for their fun and educational value.
        </p>
        
        {/* Re-use the ProductCard component in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featured.map((product) => (
            <ProductCard key={getProductKey(product)} product={product} />
          ))}
        </div>

        {/* The "Show More" button that links to all products */}
        <Link 
          href="/products" 
          className="btn-shine inline-block bg-[hsl(var(--swago-orange))] text-white font-bold px-8 py-3 rounded-full shadow-lg"
        >
          Show More Kits
        </Link>
      </div>
    </section>
  );
}
