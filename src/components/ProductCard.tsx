"use client";
import React from "react";
import { Product, useSharedContext } from "@/context/SharedContext";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } = useSharedContext();
  
  // Check if the current product is in the wishlist
  const isLiked = isWishlisted(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition relative">
      {/* Wishlist Button */}
      <button 
        onClick={handleWishlistClick}
        className="absolute top-2 right-2 p-2 rounded-full bg-white/70 hover:bg-white"
      >
        {isLiked ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-1.383-.597 15.25 15.25 0 0 1-1.313-1.173c-.434-.403-.82-1.002-1.127-1.713a11.12 11.12 0 0 1-1.162-3.687c0-2.408 1.948-4.355 4.355-4.355s4.355 1.947 4.355 4.355c0 1.25-.382 2.45-1.162 3.687-.307.711-.693 1.31-1.127 1.713-.437.526-.893.978-1.313 1.173a15.25 15.25 0 0 1-1.383.597l-.022.012-.007.004-.004.001a.752.752 0 0 1-.671 0l-.003-.001Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        )}
      </button>

      <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded" />
      <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
      <p className="text-sm text-gray-600 h-10">{product.description}</p>
      <p className="mt-2 font-bold">₹{product.price}</p>
      <button onClick={() => addToCart(product)} className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
        Add to Cart
      </button>
    </div>
  );
}