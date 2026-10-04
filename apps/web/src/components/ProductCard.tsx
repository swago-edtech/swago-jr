"use client";

import React, { useState, useEffect } from "react";
import { Product, CartItem, useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { RiShareForwardFill } from "react-icons/ri";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { cart, addToCart, addToWishlist, removeFromWishlist, isWishlisted, openCartSidebar, increaseQty, decreaseQty } = useSharedContext();

  // Use MongoDB _id or slug for routing
  const productIdentifier = product._id || product.slug || '';
  const isLiked = isWishlisted(productIdentifier);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Check if item is in cart and get quantity
  const getCartItemId = (item: CartItem): string => {
    return item.productId?.toString() || item._id?.toString() || item.id?.toString() || '';
  };

  const cartItem = cart.find(item => getCartItemId(item) === productIdentifier.toString());
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

    console.log('🛒 Adding to cart:', product.name);
    addToCart(product);
    router.push("/cart");
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


  // Support both naming conventions
  const ageCategory = product.ageCategory || product.age_category || '';
  const originalPrice = product.originalPrice || product.original_price;

  // Calculate percentage off
  const percentOff = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  const displayName = product.name;

  // Build product URL (support both slug and id)
  const productUrl = product.slug
    ? `/product/${product.slug}`
    : `/product/${product._id || product.id}`;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={productUrl} className="block group h-full">
        <div
          className="bg-white border border-slate-100 rounded-2xl flex flex-col h-full shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.2)] transition-all duration-500 overflow-hidden"
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
            {/* Mobile Age Badge - Top Right of Image area */}
            {ageCategory && (
              <div className="md:hidden absolute top-2 right-2 z-10 bg-[hsl(var(--swago-purple))] text-white text-[9px] font-black px-2 py-1 rounded-full shadow-md tracking-tight whitespace-nowrap  ">
                Age: {ageCategory.split('-')[0]}+ yrs
              </div>
            )}

            {/* Action buttons - Heart at bottom-left */}
            <div className="absolute bottom-3 left-3 z-10">
              <button
                onClick={handleWishlistClick}
                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-lg flex items-center justify-center border border-slate-100 transition-all hover:scale-110 active:scale-95"
                aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isLiked ? (
                  <AiFillHeart className="w-4 h-4 md:w-5 md:h-5 text-[hsl(var(--swago-pink))]" />
                ) : (
                  <AiOutlineHeart className="w-4 h-4 md:w-5 md:h-5 text-slate-800" />
                )}
              </button>
            </div>

            {/* Share button moved for desktop, hidden on mobile in favor of age? or keep both */}
            <div className="hidden md:block absolute top-3 right-3 z-10">
              <button
                onClick={handleShareClick}
                className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
                aria-label="Share product"
              >
                <RiShareForwardFill className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Product Label Badge (Top-Left) */}
            {product.label && (
              <div className="absolute top-3 left-3 z-10 bg-[hsl(var(--swago-purple))] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md tracking-wider">
                {product.label}
              </div>
            )}
          </div>

          <div className="p-2 sm:p-4 flex flex-col flex-grow">
            <div className="flex-grow text-left">
              {/* Product name with Read more */}
              <h3 
                className="text-xs sm:text-base font-semibold text-slate-800 mb-1 sm:mb-2 line-clamp-3 md:line-clamp-4"
                title={displayName}
              >
                {displayName}
              </h3>
            </div>

            <div className="mt-auto pt-3">
              {/* Price and Age on same line */}
              <div className="flex items-center justify-between mb-4 gap-2">
                <div className="flex items-center gap-2">
                  {percentOff > 0 && (
                    <span className="bg-[#e11d48] text-white text-[10px] font-black px-1.5 py-1 rounded">
                      -{percentOff}%
                    </span>
                  )}
                  <span className="text-base sm:text-lg font-black text-slate-900">₹{product.price}</span>
                  {originalPrice && (
                    <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">₹{originalPrice}</span>
                  )}
                </div>
                {ageCategory && (
                  <span className="hidden md:inline-block bg-[hsl(var(--swago-purple))] text-white text-[10px] sm:text-[11px] font-extrabold px-3 py-1.5 rounded-full tracking-tight whitespace-nowrap shadow-sm">
                    Age: {ageCategory.split('-')[0]}+ yrs
                  </span>
                )}
              </div>

              {/* Promotional Message */}
              {product.showPromotionalMessage && product.promotionalMessage && (
                <div className="mb-3 px-2 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg text-center shadow-sm">
                  <span className="text-[10px] sm:text-xs lg:text-sm font-bold text-blue-800 block">
                    {product.promotionalMessage}
                  </span>
                </div>
              )}

              {/* Show Add to Cart OR Quantity Controls */}
              {!isInCart ? (
                // Show "Add to Cart" button when item is NOT in cart
                <motion.button
                  onClick={handleAddToCart}
                  className={`w-full font-black py-3 rounded-xl text-xs tracking-widest transition-all duration-300 border-2 border-[hsl(var(--swago-purple))] text-[hsl(var(--swago-purple))] bg-white hover:bg-[hsl(var(--swago-purple))] hover:text-white shadow-sm`}
                >
                  <span>Add to Cart</span>
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
                    disabled={false}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
