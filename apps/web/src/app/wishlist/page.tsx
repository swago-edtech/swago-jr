"use client";

import { useEffect, useState } from "react";
import { useSharedContext, Product } from "@/context/SharedContext";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

export default function WishlistPage() {
  const { user } = useSharedContext();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setLoading(false);
        return;
      };

      try {
        const res = await fetch('/api/wishlist');
        if (!res.ok) throw new Error("Failed to fetch wishlist");
        const data = await res.json();
        setWishlistItems(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (user !== undefined) {
      fetchWishlist();
    }
  }, [user]);

  if (loading) return <p className="text-center p-12">Loading wishlist...</p>;

  if (!user) {
    return (
      <div className="container mx-auto text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your wishlist.</h2>
        <Link
          href="/login"
          className="inline-block bg-[hsl(var(--swago-purple))] text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 transition"
        >
          Login Now
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-500 text-center p-12">Error: {error}</p>;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">My Wishlist</h1>
      {wishlistItems.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-bold">Your wishlist is empty.</h2>
          <p className="text-slate-500 mt-2 mb-6">Explore our smart box and add your favorites by clicking the heart icon!</p>
          <Link href="/products" className="inline-block bg-[hsl(var(--swago-orange))] text-white font-bold px-6 py-3 rounded-lg hover:opacity-90 transition">
            Explore Smart Box
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-8 md:gap-6">
          {wishlistItems.map(product => (
            <ProductCard
              key={product._id || product.id || Math.random()}
              product={product}
            />
          ))}
        </div>
      )}
    </div>
  );
}
