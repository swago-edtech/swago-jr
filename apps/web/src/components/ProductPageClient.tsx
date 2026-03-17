"use client";

import React, { useState, useEffect } from "react";
import { useSharedContext, Product, CartItem } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReviewList from "./ReviewList";
import RelatedProducts from "./RelatedProducts";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { RiShareForwardFill } from "react-icons/ri";

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

function AccordionItem({ title, content, isOpen, onToggle }: { title: string; content: React.ReactNode; isOpen: boolean; onToggle: () => void; }) {
  return (
    <div className={`border-b border-purple-50 transition-colors duration-300 ${isOpen ? 'bg-purple-50/10' : ''}`}>
      <button 
        onClick={onToggle} 
        className="w-full flex justify-between items-center py-5 text-left group"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-[hsl(var(--swago-purple))]' : 'text-slate-800 group-hover:text-[hsl(var(--swago-purple))]'}`}>
          {title}
        </span>
        <motion.span 
          animate={{ rotate: isOpen ? 45 : 0 }}
          className={`p-1 rounded-full transition-colors ${isOpen ? 'bg-[hsl(var(--swago-purple))] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-100 group-hover:text-[hsl(var(--swago-purple))]'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3, ease: "easeInOut" }} 
            className="overflow-hidden"
          >
            <div className="pb-6 text-slate-600 leading-relaxed text-[15px]">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    zIndex: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    zIndex: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    zIndex: 0,
  }),
};

export default function ProductPageClient({ product }: { product: Product }) {
  const router = useRouter();
  const [mainImage, setMainImage] = useState(product.images[0]);
  const [direction, setDirection] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>("description");
  const [showFullName, setShowFullName] = useState(false);
  const { cart, addToCart, isWishlisted, addToWishlist, removeFromWishlist, user, openCartSidebar, increaseQty, decreaseQty } = useSharedContext();
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past the main product info (around 600px)
      if (window.scrollY > 600) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get product identifier for routing - always use MongoDB _id or slug
  const getProductNumericId = (product: any): number | null => {
    return null; // Only use MongoDB _id or slug for routing
  };

  // ✅ FIXED: Use the SAME logic as ProductCard
  const getProductIdentifier = (): string | number => {
    if (product._id && !product._id.startsWith('hardcoded-')) {
      return product._id; // DB products (MongoDB ObjectId)
    }

    if (product.id) {
      return product.id; // Hardcoded products (numeric ID)
    }

    if (product._id?.startsWith('hardcoded-')) {
      return parseInt(product._id.replace('hardcoded-', ''));
    }

    return 0;
  };

  const productIdentifier = getProductIdentifier();
  const isLiked = isWishlisted(productIdentifier);

  // ✅ NEW: Create numeric ID for ReviewList (reviews use numeric IDs)
  // ✅ NEW: Correct ID for ReviewList (using database string ID)
  const productIdForReviews = productIdentifier.toString();

  // ✅ Check if item is in cart and get quantity (SAME as ProductCard)
  const getProductId = (item: CartItem): string => {
    return item.productId?.toString() || item._id?.toString() || item.id?.toString() || '';
  };

  const cartItem = cart.find(item => getProductId(item) === productIdentifier.toString());
  const quantityInCart = cartItem?.quantity || 0;
  const isInCart = quantityInCart > 0;

  // Stock status
  const stock = product.stock;
  const isOutOfStock = stock !== undefined && stock === 0;
  const isLowStock = stock !== undefined && stock > 0 && stock < 10;
  const maxQuantity = stock !== undefined ? stock : 999;

  // Support both naming conventions
  const ageCategory = product.ageCategory || product.age_category || '';
  const originalPrice = product.originalPrice || product.original_price;
  const benefits = product.benefits;
  const boxContents = product.boxContents || product.box_contents;

  // Calculate percentage off
  const percentOff = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  // Truncate product name to first 4 words
  const words = product.name.split(' ');
  const isLongName = words.length > 4;
  const displayName = showFullName ? product.name : (isLongName ? words.slice(0, 4).join(' ') + '...' : product.name);

  const handleNextImage = () => {
    setDirection(1);
    const currentIndex = product.images.indexOf(mainImage!);
    const nextIndex = (currentIndex + 1) % product.images.length;
    setMainImage(product.images[nextIndex]);
  };

  const handlePrevImage = () => {
    setDirection(-1);
    const currentIndex = product.images.indexOf(mainImage!);
    const prevIndex = (currentIndex - 1 + product.images.length) % product.images.length;
    setMainImage(product.images[prevIndex]);
  };

  const handleThumbnailClick = (img: string) => {
    const currentIndex = product.images.indexOf(mainImage!);
    const newIndex = product.images.indexOf(img);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setMainImage(img);
  };

  const handleWishlistClick = () => {
    if (isLiked) {
      removeFromWishlist(productIdentifier);
    } else {
      addToWishlist(productIdentifier);
    }
  };

  const handleShareClick = async () => {
    let shareIdentifier: string | number;

    if (product.id !== undefined && product.id !== null && typeof product.id === 'number') {
      shareIdentifier = product.id;
    } else if (product.slug) {
      shareIdentifier = product.slug;
    } else {
      shareIdentifier = product._id || '';
    }

    const productUrl = `${window.location.origin}/product/${shareIdentifier}`;

    console.log('📤 Sharing:', productUrl);

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on Swago Jr!`,
          url: productUrl,
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        alert('Product link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    
    if (!isInCart) {
      addToCart(product, quantity);
    }

    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      if (!isInCart) {
        openCartSidebar();
      } else {
        router.push("/cart");
      }
    } else {
      router.push("/cart");
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);

    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      openCartSidebar();
    }
  };

  const handleIncrease = () => {
    increaseQty(productIdentifier);
  };

  const handleDecrease = () => {
    decreaseQty(productIdentifier);
  };

  const renderListContent = (text: string | undefined) => {
    if (!text) return null;
    return (
      <ul className="space-y-2">
        {text.split("\n").map((item, index) => item.trim() && (
          <li key={index} className="flex items-start gap-3">
            <CheckIcon /><span>{item.trim().replace(/^✅\s*/, "")}</span>
          </li>
        ))}
      </ul>
    );
  };

  const accordionItems = [
    { title: "Description", content: (<div className="whitespace-pre-wrap">{product.description}</div>), key: "description" },
    { title: "Benefits", content: renderListContent(benefits), key: "benefits" },
    { title: "What's in the box", content: renderListContent(boxContents), key: "box_contents" },
  ];

  return (
    <>
      <div className="container mx-auto px-4 py-2 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-start">

          {/* Image Gallery Section (60% Space) */}
          <div className="md:col-span-7">
            <div className="relative w-full h-[14rem] sm:h-[18rem] md:h-auto md:aspect-[4/5] md:max-h-[550px] bg-slate-100 rounded-lg overflow-hidden shadow-lg group">
              {isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-1 md:py-2 rounded-full z-10">
                  Out of Stock
                </div>
              )}
              {isLowStock && !isOutOfStock && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-1 md:py-2 rounded-full z-10">
                  Only {stock} left!
                </div>
              )}

              <div className="absolute top-3 right-3 flex gap-1.5 z-10">
                <button
                  onClick={handleShareClick}
                  className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition shadow-sm"
                  aria-label="Share product"
                  title="Share product"
                >
                  <RiShareForwardFill className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                </button>

                <button
                  onClick={handleWishlistClick}
                  className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition shadow-sm"
                  aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                  title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {isLiked ? (
                    <AiFillHeart className="w-4 h-4 md:w-5 md:h-5 text-[hsl(var(--swago-pink))]" />
                  ) : (
                    <AiOutlineHeart className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                  )}
                </button>
              </div>

              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={mainImage}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 w-full h-full"
                >
                  <Image src={mainImage!} alt={product.name} fill className="object-cover object-bottom" />
                </motion.div>
              </AnimatePresence>

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/90 p-2 rounded-full text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    aria-label="Previous image"
                    title="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/90 p-2 rounded-full text-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
                    aria-label="Next image"
                    title="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => handleThumbnailClick(img)}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                          mainImage === img 
                            ? "bg-white w-4" 
                            : "bg-white/50 hover:bg-white/80"
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex overflow-x-auto gap-2 mt-3 pb-2 scrollbar-none snap-x md:grid md:grid-cols-5 lg:grid-cols-6 md:gap-3 md:mt-4 md:pb-0">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleThumbnailClick(img)}
                  title={`View image ${index + 1}`}
                  aria-label={`View image ${index + 1}`}
                  className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-full md:h-14 lg:h-16 bg-slate-100 rounded-md overflow-hidden border-2 transition-colors snap-start ${mainImage === img ? "border-[hsl(var(--swago-purple))]" : "border-transparent"
                    }`}
                >
                  <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover object-bottom" />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 pt-2 md:pt-0">
            <div className="mb-1">
              <h1 className="text-xl md:text-4xl font-bold text-zoom-in leading-tight">
                {displayName}
                {isLongName && (
                  <button
                    onClick={() => setShowFullName(!showFullName)}
                    className="text-[hsl(var(--swago-purple))] text-sm md:text-lg ml-2 hover:underline inline-block"
                  >
                    {showFullName ? 'Show less' : 'Read more'}
                  </button>
                )}
              </h1>
            </div>

            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center bg-[hsl(var(--swago-purple))] text-white text-[10px] md:text-sm font-semibold px-2 py-0.5 md:px-3 md:py-1 rounded-full">
                Age: {ageCategory}
              </span>

              {stock !== undefined && (
                <>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center bg-[hsl(var(--swago-orange))] text-gray-700 text-xs md:text-sm font-semibold px-2 md:px-3 py-1 rounded-full">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center bg-orange-100 text-orange-700 text-xs md:text-sm font-semibold px-2 md:px-3 py-1 rounded-full">
                      Only {stock} left
                    </span>
                  ) : null}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap my-1.5">
              <p className="text-2xl md:text-3xl font-black text-slate-900 text-pop-bounce">
                ₹{product.price}
              </p>
              {originalPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-base md:text-xl text-slate-400 line-through">
                    ₹{originalPrice}
                  </span>
                  <span className="inline-block bg-[hsl(var(--swago-orange))] text-white text-[10px] md:text-sm font-bold px-1.5 md:px-3 py-0.5 md:py-1 rounded">
                    {percentOff}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Show quantity selector ONLY if NOT in cart */}
            {!isOutOfStock && !isInCart && (
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <label className="font-semibold text-sm md:text-base">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-base md:text-lg hover:bg-gray-50"
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 md:px-4 py-1.5 md:py-2 text-base md:text-lg font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    className="px-3 md:px-4 py-1.5 md:py-2 text-base md:text-lg hover:bg-gray-50"
                    aria-label="Increase quantity"
                    title="Increase quantity"
                    disabled={quantity >= maxQuantity}
                  >
                    +
                  </button>
                </div>
                {stock !== undefined && quantity >= stock && (
                  <span className="text-xs md:text-sm text-orange-600 font-medium">
                    Max available: {stock}
                  </span>
                )}
              </div>
            )}

            {isOutOfStock && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-6">
                <p className="text-red-700 font-semibold text-sm md:text-base">This product is currently out of stock.</p>
                <p className="text-red-600 text-xs md:text-sm mt-1">Please check back later or contact us for availability.</p>
              </div>
            )}

            {/* ✅ FIXED: Buttons - quantity controls replace Add to Cart when in cart */}
            <div className="flex gap-3 md:gap-4">
              {!isInCart ? (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 font-bold py-2.5 md:py-3 rounded-lg text-sm md:text-base transition-all duration-300 ${isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-shine bg-[hsl(var(--swago-purple))] text-white shadow-sm hover:shadow-md'
                    }`}
                >
                  <span className="relative z-10">{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                </motion.button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 border-2 border-[hsl(var(--swago-purple))] rounded-lg bg-purple-50 py-1.5 md:py-2">
                  <button
                    onClick={handleDecrease}
                    className="px-3 md:px-4 py-1 hover:bg-purple-100 transition text-[hsl(var(--swago-purple))] font-bold text-lg md:text-xl"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="font-bold text-lg md:text-xl text-[hsl(var(--swago-purple))] min-w-[2rem] text-center">
                    {quantityInCart}
                  </span>
                  <button
                    onClick={handleIncrease}
                    className="px-3 md:px-4 py-1 hover:bg-purple-100 transition text-[hsl(var(--swago-purple))] font-bold text-lg md:text-xl"
                    aria-label="Increase quantity"
                    disabled={stock !== undefined && quantityInCart >= stock}
                  >
                    +
                  </button>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (isInCart) {
                    router.push('/cart');
                  } else {
                    handleBuyNow();
                  }
                }}
                disabled={isOutOfStock}
                className={`flex-1 font-bold py-2.5 md:py-3 rounded-lg text-sm md:text-base transition-all duration-300 ${isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'btn-shine bg-[hsl(var(--swago-orange))] text-white shadow-sm hover:shadow-md'
                  }`}
              >
                <span className="relative z-10">{isOutOfStock ? 'Out of Stock' : isInCart ? 'View Cart' : 'Buy It Now'}</span>
              </motion.button>
            </div>

            <div className="mt-8">
              {accordionItems.map((item) =>
                (benefits && item.key === "benefits" && benefits.trim() !== "") ||
                  (boxContents && item.key === "box_contents" && boxContents.trim() !== "") ||
                  item.key === "description" ? (
                  <AccordionItem key={item.key} title={item.title} content={item.content} isOpen={openAccordion === item.key} onToggle={() => setOpenAccordion(openAccordion === item.key ? null : item.key)} />
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t pt-12">
          <ReviewList productId={productIdForReviews} currentUserId={user?.phone} />
        </div>

        <RelatedProducts 
          currentProductId={productIdForReviews} 
          ageCategory={ageCategory} 
        />
      </div>


      {/* Sticky Bottom Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] py-3 px-4"
          >
            <div className="container mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[300px] text-sm sm:text-base">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[hsl(var(--swago-purple))] text-sm sm:text-base">₹{product.price}</span>
                    {originalPrice && (
                      <span className="text-[10px] sm:text-xs text-slate-400 line-through">₹{originalPrice}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {!isInCart ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${isOutOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[hsl(var(--swago-purple))] text-white shadow-sm hover:shadow-md'
                      }`}
                  >
                    <span className="relative z-10">{isOutOfStock ? 'Out' : 'Add to Cart'}</span>
                  </motion.button>
                ) : (
                  <div className="flex items-center bg-purple-50 border border-purple-100 rounded-xl px-2">
                    <button onClick={handleDecrease} className="p-2 text-[hsl(var(--swago-purple))] font-bold">−</button>
                    <span className="px-2 font-bold text-[hsl(var(--swago-purple))] min-w-[1.5rem] text-center">{quantityInCart}</span>
                    <button onClick={handleIncrease} className="p-2 text-[hsl(var(--swago-purple))] font-bold">+</button>
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBuyNow}
                  className={`${isInCart ? 'hidden lg:block' : 'block'} bg-[hsl(var(--swago-orange))] text-white font-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md whitespace-nowrap`}
                >
                  Buy Now
                </motion.button>

                {isInCart && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cart')}
                    className="bg-[hsl(var(--swago-purple))] text-white font-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    Checkout
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
