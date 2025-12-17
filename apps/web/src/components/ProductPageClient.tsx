"use client";

import { useState } from "react";
import { useSharedContext, Product } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReviewList from "./ReviewList";

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

function AccordionItem({ title, content, isOpen, onToggle }: { title: string; content: React.ReactNode; isOpen: boolean; onToggle: () => void; }) {
  return (
    <div className="border-b">
      <button onClick={onToggle} className="w-full flex justify-between items-center py-4 text-left">
        <span className="text-lg font-semibold">{title}</span>
        <motion.span animate={{ rotate: isOpen ? 45 : 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden">
            <div className="pb-4 text-slate-600 prose-sm">{content}</div>
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
  const { addToCart, isWishlisted, addToWishlist, removeFromWishlist, user } = useSharedContext();

  // Support both ID formats
  const productId = product.id || parseInt(product._id?.replace('hardcoded-', '') || '0');
  const isLiked = isWishlisted(productId);

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
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    router.push("/cart");
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
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
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          
          {/* Image Gallery Section */}
          <div className="md:col-span-2">
            <div className="relative w-full h-[32rem] bg-slate-100 rounded-lg overflow-hidden shadow-lg group">
              {/* Stock Badge on Image */}
              {isOutOfStock && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full z-10">
                  Out of Stock
                </div>
              )}
              {isLowStock && !isOutOfStock && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full z-10">
                  Only {stock} left!
                </div>
              )}

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
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleThumbnailClick(img)}
                  title={`View image ${index + 1}`}
                  aria-label={`View image ${index + 1}`} 
                  className={`relative w-full h-20 bg-slate-100 rounded-md overflow-hidden border-2 transition-colors ${
                    mainImage === img ? "border-[hsl(var(--swago-purple))]" : "border-transparent"
                  }`}
                >
                  <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover object-bottom" />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between items-start">
              {/* ✨ UPDATED: Added text-zoom-in effect */}
              <h1 className="text-4xl font-bold text-zoom-in">{product.name}</h1>
              <button 
                onClick={handleWishlistClick} 
                className="p-2" 
                aria-label={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
                title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {isLiked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[hsl(var(--swago-pink))]">
                    <path d="M11.645 20.91a.75.75 0 0 1-1.29 0C8.125 18.172 4.5 14.51 4.5 10.5c0-2.897 2.353-5.25 5.25-5.25c.928 0 1.78.243 2.508.663c.728-.42 1.58-.663 2.508-.663c2.897 0 5.25 2.353 5.25 5.25c0 4.01-3.625 7.672-5.855 10.41a.75.75 0 0 1-1.29 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="mt-2 flex items-center gap-3">
              <span className="inline-flex items-center bg-[hsl(var(--swago-teal))] text-white text-sm font-semibold px-3 py-1 rounded-full">
                Age: {ageCategory}
              </span>
              
              {/* Stock Status Badge */}
              {stock !== undefined && (
                <>
                  {isOutOfStock ? (
                    <span className="inline-flex items-center bg-red-100 text-red-700 text-sm font-semibold px-3 py-1 rounded-full">
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center bg-orange-100 text-orange-700 text-sm font-semibold px-3 py-1 rounded-full">
                      Only {stock} left
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                      In Stock ({stock} available)
                    </span>
                  )}
                </>
              )}
            </div>

            {/* ✨ UPDATED: Added text-pop-bounce effect on price */}
            <p className="text-3xl font-bold text-slate-900 my-4 text-pop-bounce">
              ₹{product.price}
              {originalPrice && (
                <span className="text-xl text-slate-400 line-through ml-2">
                  ₹{originalPrice}
                </span>
              )}
            </p>

            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-6">
                <label className="font-semibold">Quantity:</label>
                <div className="flex items-center border rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))} 
                    className="px-4 py-2 text-lg hover:bg-gray-50"
                    aria-label="Decrease quantity" 
                    title="Decrease quantity"
                  > 
                    - 
                  </button>
                  <span className="px-4 py-2 text-lg font-semibold">{quantity}</span>
                  <button 
                    type="button" 
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} 
                    className="px-4 py-2 text-lg hover:bg-gray-50"
                    aria-label="Increase quantity"
                    title="Increase quantity"
                    disabled={quantity >= maxQuantity}
                  > 
                    + 
                  </button>
                </div>
                {stock !== undefined && quantity >= stock && (
                  <span className="text-sm text-orange-600 font-medium">
                    Max available: {stock}
                  </span>
                )}
              </div>
            )}

            {isOutOfStock && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700 font-semibold">This product is currently out of stock.</p>
                <p className="text-red-600 text-sm mt-1">Please check back later or contact us for availability.</p>
              </div>
            )}

            {/* ✨ UPDATED: Added btn-text-pop to both buttons and wrapped text in span */}
            <div className="flex gap-4">
              <button 
                onClick={handleAddToCart} 
                disabled={isOutOfStock}
                className={`flex-1 font-bold py-3 rounded-lg text-base transition ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-shine btn-text-pop bg-[hsl(var(--swago-purple))] text-white'
                }`}
              >
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
              <button 
                onClick={handleBuyNow} 
                disabled={isOutOfStock}
                className={`flex-1 font-bold py-3 rounded-lg text-base transition ${
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-shine btn-text-pop bg-[hsl(var(--swago-orange))] text-white'
                }`}
              >
                <span>{isOutOfStock ? 'Out of Stock' : 'Buy It Now'}</span>
              </button>
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
          <ReviewList productId={productId} currentUserId={user?.phone} />
        </div>
      </div>

      {/* ✨ UPDATED: Added btn-text-pop to View More Products button */}
      <div className="text-center pt-8 pb-16">
        <Link href="/products" className="btn-shine btn-text-pop inline-block bg-[hsl(var(--swago-teal))] text-white font-bold px-8 py-3 rounded-full shadow-lg">
          <span>View More Products</span>
        </Link>
      </div>
    </>
  );
}
