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
    // Fetch the full product details for the wishlisted items
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user]);

  if (loading) return <p>Loading wishlist...</p>;

  if (!user) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Please log in to view your wishlist.</h2>
        <Link href="/login" className="text-blue-600 hover:underline">
          Login now
        </Link>
      </div>
    );
  }

  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
      {wishlistItems.length === 0 ? (
        <p>You haven't added any items to your wishlist yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {wishlistItems.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}