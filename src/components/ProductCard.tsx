"use client";
import React, { useState, useEffect } from "react";
import { Product, useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image"; // 1. Import the Image component

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } = useSharedContext();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  const isLiked = isWishlisted(product.id);

  useEffect(() => {
    if (!isHovering) {
      setCurrentImageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isHovering, product.images]); // Simplified dependency array

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Also prevent navigation when clicking the heart
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Link href={`/product/${product.id}`} className="block h-full">
      <div 
        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-shadow h-full"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* 2. Move sizing classes to the parent div and add overflow-hidden */}
        <div className="relative w-full h-40 rounded-md overflow-hidden">
          {/* 3. Replace <img> with <Image> using the 'fill' prop */}
          <Image 
            src={product.images[currentImageIndex]} 
            alt={product.name} 
            fill
            className="object-cover transition-opacity duration-300" 
          />
          <button 
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition"
            aria-label="Add to wishlist"
          >
            {isLiked ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[hsl(var(--swago-pink))]"><path d="M11.645 20.91a.75.75 0 0 1-1.29 0C8.125 18.172 4.5 14.51 4.5 10.5c0-2.897 2.353-5.25 5.25-5.25c.928 0 1.78.243 2.508.663c.728-.42 1.58-.663 2.508-.663c2.897 0 5.25 2.353 5.25 5.25c0 4.01-3.625 7.672-5.855 10.41a.75.75 0 0 1-1.29 0Z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            )}
          </button>
        </div>
        <div className="flex flex-col gap-2 flex-grow">
          <h3 className="text-lg font-semibold text-slate-800">{product.name}</h3>
          <p className="text-sm text-slate-600 flex-grow">{product.description}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">₹{product.price}</p>
        </div>
        <button 
          onClick={(e) => { e.preventDefault(); addToCart(product); }} 
          className="w-full bg-[hsl(var(--swago-purple))] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Add to Cart
        </button>
      </div>
    </Link>
  );
}