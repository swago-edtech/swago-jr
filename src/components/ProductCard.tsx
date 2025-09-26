"use client";

import React, { useState, useEffect } from "react";
import { Product, useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } = useSharedContext();
  const isLiked = isWishlisted(product.id);

  // 1. Re-added state for hover and image index tracking
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // 2. Re-added the useEffect to cycle images on hover
  useEffect(() => {
    if (!isHovering) {
      setCurrentImageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }, 800); // 800ms delay between images

    return () => clearInterval(interval);
  }, [isHovering, product.images]);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Link href={`/product/${product.id}`} className="block group h-full">
      {/* 3. Re-added event handlers to the main card container */}
      <div 
        className="bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-sm group-hover:shadow-lg transition-shadow duration-300"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        
        {/* Image Section */}
        <div className="relative w-full aspect-square rounded-t-xl overflow-hidden">
          <Image 
            src={product.images[currentImageIndex]} // 4. Source now uses the state index
            alt={product.name} 
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105" 
          />
          <button 
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition z-10"
            aria-label="Add to wishlist"
          >
            {isLiked ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[hsl(var(--swago-pink))]"><path d="M11.645 20.91a.75.75 0 0 1-1.29 0C8.125 18.172 4.5 14.51 4.5 10.5c0-2.897 2.353-5.25 5.25-5.25c.928 0 1.78.243 2.508.663c.728-.42 1.58-.663 2.508-.663c2.897 0 5.25 2.353 5.25 5.25c0 4.01-3.625 7.672-5.855 10.41a.75.75 0 0 1-1.29 0Z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            )}
          </button>
        </div>
        
        {/* Content Section */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-base font-semibold text-slate-800 flex-grow mb-2">{product.name}</h3>
          
          <div className="mt-auto">
            <p className="text-lg font-bold text-slate-900 mb-3">₹{product.price}</p>
            <motion.button 
              onClick={(e) => { e.preventDefault(); addToCart(product); }} 
              className="btn-shine w-full bg-[hsl(var(--swago-purple))] text-white font-semibold py-2.5 rounded-lg text-sm"
            >
              Add to Cart
            </motion.button>
          </div>
        </div>
      </div>
    </Link>
  );
}