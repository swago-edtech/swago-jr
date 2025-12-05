"use client";

import React, { useState, useEffect } from "react";
import { Product, useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart, addToWishlist, removeFromWishlist, isWishlisted } = useSharedContext();
  
  // ✅ FIXED: Send the correct identifier based on product source
  // - Database products: Use MongoDB _id string (e.g., "692ecdd8899e1646b312effd")
  // - Hardcoded products: Use numeric id (e.g., 1, 2, 3)
  // - Hardcoded with _id: Strip "hardcoded-" prefix to get numeric id
  const getProductIdentifier = (): string | number => {
    // If it's a database product with MongoDB _id
    if (product._id && !product._id.startsWith('hardcoded-')) {
      return product._id; // Return string
    }
    
    // If it's a hardcoded product with numeric id
    if (product.id) {
      return product.id; // Return number
    }
    
    // If it's a hardcoded product with synthetic _id like "hardcoded-1"
    if (product._id?.startsWith('hardcoded-')) {
      return parseInt(product._id.replace('hardcoded-', ''));
    }
    
    return 0; // Fallback
  };

  const productIdentifier = getProductIdentifier();
  const isLiked = isWishlisted(productIdentifier);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Get stock status
  const stock = product.stock;
  const isOutOfStock = stock !== undefined && stock === 0;
  const isLowStock = stock !== undefined && stock > 0 && stock < 10;

  useEffect(() => {
    if (!isHovering) {
      setCurrentImageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.images.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isHovering, product.images]);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('💝 Wishlist clicked:', { 
      productIdentifier, 
      type: typeof productIdentifier,
      isLiked 
    });
    
    if (isLiked) {
      removeFromWishlist(productIdentifier);
    } else {
      addToWishlist(productIdentifier);
    }
  };

  // Support both naming conventions
  const ageCategory = product.ageCategory || product.age_category || '';
  const originalPrice = product.originalPrice || product.original_price;

  // Build product URL (support both slug and id)
  const productUrl = product.slug 
    ? `/product/${product.slug}` 
    : `/product/${product._id || product.id}`;

  return (
    <Link href={productUrl} className="block group h-full">
      <div 
        className="bg-white border border-slate-200 rounded-xl flex flex-col h-full shadow-sm group-hover:shadow-lg transition-shadow duration-300"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        
        {/* Image Section */}
        <div className="relative w-full aspect-square rounded-t-xl overflow-hidden">
          <Image 
            src={product.images[currentImageIndex]}
            alt={product.name} 
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105" 
          />
          
          {/* Wishlist Button */}
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

          {/* Stock Badges */}
          {isOutOfStock && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              Out of Stock
            </div>
          )}
          {isLowStock && !isOutOfStock && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
              Only {stock} left!
            </div>
          )}
        </div>
        
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex-grow">
            <h3 className="text-base font-semibold text-slate-800 mb-2 h-12 line-clamp-2">
              {product.name}
            </h3>
          </div>
          
          <div className="mt-auto pt-3">
            <div className="flex justify-between items-center mb-3">
              <p>
                <span className="text-lg font-bold text-slate-900">₹{product.price}</span>
                {originalPrice && (
                  <span className="text-sm text-slate-400 line-through ml-2">
                    ₹{originalPrice}
                  </span>
                )}
              </p>
              <span className="inline-block bg-[hsl(var(--swago-teal))] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Age: {ageCategory}
              </span>
            </div>
            
            <motion.button 
              onClick={(e) => { 
                e.preventDefault(); 
                if (!isOutOfStock) {
                  addToCart(product);
                }
              }} 
              disabled={isOutOfStock}
              className={`w-full font-semibold py-2.5 rounded-lg text-sm transition ${
                isOutOfStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'btn-shine bg-[hsl(var(--swago-purple))] text-white'
              }`}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </motion.button>
          </div>
        </div>
      </div>
    </Link>
  );
}
