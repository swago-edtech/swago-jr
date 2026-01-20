"use client";

import React, { useState, useEffect } from "react";
import { Product, CartItem, useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
// ✅ NEW: Import react-icons
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { RiShareForwardFill } from "react-icons/ri";

export default function ProductCard({ product }: { product: Product }) {
  const { cart, addToCart, addToWishlist, removeFromWishlist, isWishlisted, openCartSidebar, increaseQty, decreaseQty } = useSharedContext();
  
  const getProductIdentifier = (): string | number => {
    if (product._id && !product._id.startsWith('hardcoded-')) {
      return product._id;
    }
    
    if (product.id) {
      return product.id;
    }
    
    if (product._id?.startsWith('hardcoded-')) {
      return parseInt(product._id.replace('hardcoded-', ''));
    }
    
    return 0;
  };

  const productIdentifier = getProductIdentifier();
  const isLiked = isWishlisted(productIdentifier);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [showFullName, setShowFullName] = useState(false); // ✅ NEW: For name expansion

  // Get stock status
  const stock = product.stock;
  const isOutOfStock = stock !== undefined && stock === 0;
  const isLowStock = stock !== undefined && stock > 0 && stock < 10;

  // Check if item is in cart and get quantity
  const getProductId = (item: CartItem): string => {
    return item.productId?.toString() || item._id?.toString() || item.id?.toString() || '';
  };
  
  const cartItem = cart.find(item => getProductId(item) === productIdentifier.toString());
  const quantityInCart = cartItem?.quantity || 0;
  const isInCart = quantityInCart > 0;

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

  // ✅ NEW: Handle share button
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const productUrl = product.slug 
      ? `${window.location.origin}/product/${product.slug}` 
      : `${window.location.origin}/product/${product._id || product.id}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Swago Jr!`,
          url: productUrl,
        });
        console.log('✅ Shared successfully');
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(productUrl);
        alert('Product link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Handle add to cart with auto-open sidebar (desktop only)
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) return;
    
    console.log('🛒 Adding to cart:', product.name);
    addToCart(product);
    
    // Auto-open sidebar only on desktop/tablet (screen width > 768px)
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      console.log('✅ Opening cart sidebar (desktop)');
      openCartSidebar();
    } else {
      console.log('📱 Mobile detected, not opening sidebar');
    }
  };

  // Handle quantity increase
  const handleIncrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    increaseQty(productIdentifier);
  };

  // Handle quantity decrease
  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    decreaseQty(productIdentifier);
  };

  // ✅ NEW: Toggle full name
  const handleReadMoreClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFullName(!showFullName);
  };

  // Support both naming conventions
  const ageCategory = product.ageCategory || product.age_category || '';
  const originalPrice = product.originalPrice || product.original_price;

  // Calculate percentage off
  const percentOff = originalPrice 
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // ✅ NEW: Truncate product name to first 4 words
  const words = product.name.split(' ');
  const isLongName = words.length > 4;
  const displayName = showFullName ? product.name : (isLongName ? words.slice(0, 4).join(' ') + '...' : product.name);

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
          
          {/* ✅ UPDATED: Action buttons with react-icons */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            {/* Share Button */}
            <button 
              onClick={handleShareClick}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition"
              aria-label="Share product"
              title="Share product"
            >
              <RiShareForwardFill className="w-6 h-6 text-slate-600" />
            </button>
            
            {/* Wishlist Button */}
            <button 
              onClick={handleWishlistClick}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition"
              aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
              title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isLiked ? (
                <AiFillHeart className="w-6 h-6 text-[hsl(var(--swago-pink))]" />
              ) : (
                <AiOutlineHeart className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>

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
            {/* ✅ UPDATED: Product name with Read more */}
            <h3 className="text-base font-semibold text-slate-800 mb-2 min-h-12 text-zoom-in">
              {displayName}
              {isLongName && !showFullName && (
                <button
                  onClick={handleReadMoreClick}
                  className="text-[hsl(var(--swago-purple))] text-sm ml-1 hover:underline"
                >
                  Read more
                </button>
              )}
              {isLongName && showFullName && (
                <button
                  onClick={handleReadMoreClick}
                  className="text-[hsl(var(--swago-purple))] text-sm ml-1 hover:underline"
                >
                  Show less
                </button>
              )}
            </h3>
          </div>
          
          <div className="mt-auto pt-3">
            {/* Price section with percentage badge */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-slate-900 text-pop">₹{product.price}</span>
                  {originalPrice && (
                    <>
                      <span className="text-sm text-slate-400 line-through">
                        ₹{originalPrice}
                      </span>
                      {/* Percentage Off Badge */}
                      <span className="inline-block bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                        {percentOff}% OFF
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="inline-block bg-[hsl(var(--swago-teal))] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                Age: {ageCategory}
              </span>
            </div>
            
            {/* Show Add to Cart OR Quantity Controls */}
            {!isInCart ? (
              // Show "Add to Cart" button when item is NOT in cart
              <motion.button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`w-full font-semibold py-2.5 rounded-lg text-sm transition ${
                  isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'btn-shine btn-text-pop bg-[hsl(var(--swago-purple))] text-white'
                }`}
              >
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </motion.button>
            ) : (
              // Show quantity controls when item IS in cart
              <div className="flex items-center justify-center gap-2 border-2 border-[hsl(var(--swago-purple))] rounded-lg bg-purple-50">
                <button
                  onClick={handleDecrease}
                  className="px-3 py-2 hover:bg-purple-100 transition text-[hsl(var(--swago-purple))] font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="font-bold text-lg text-[hsl(var(--swago-purple))] min-w-[2rem] text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={handleIncrease}
                  className="px-3 py-2 hover:bg-purple-100 transition text-[hsl(var(--swago-purple))] font-bold text-lg"
                  aria-label="Increase quantity"
                  disabled={stock !== undefined && quantityInCart >= stock}
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
