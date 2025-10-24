"use client";

import { useState } from "react";
import { products } from "@swago/utils";
import { useSharedContext } from "@/context/SharedContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import ReviewList from "./ReviewList"; // ✅ NEW IMPORT

type Product = (typeof products)[0];

const CheckIcon = () => (
  <svg
    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2.5"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

function AccordionItem({
  title,
  content,
  isOpen,
  onToggle,
}: {
  title: string;
  content: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-4 text-left"
      >
        <span className="text-lg font-semibold">{title}</span>
        <motion.span animate={{ rotate: isOpen ? 45 : 0 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
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
            <div className="pb-4 text-slate-600 prose-sm">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductPageClient({ product }: { product: Product }) {
  const router = useRouter();
  const [mainImage, setMainImage] = useState(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(
    "description"
  );
  const { addToCart, isWishlisted, addToWishlist, removeFromWishlist, user } = // ✅ Added user
    useSharedContext();

  const isLiked = isWishlisted(product.id);

  const handleWishlistClick = () => {
    if (isLiked) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/cart");
  };

  const renderListContent = (text: string | undefined) => {
    if (!text) return null;
    return (
      <ul className="space-y-2">
        {text.split("\n").map(
          (item, index) =>
            item.trim() && (
              <li key={index} className="flex items-start gap-3">
                <CheckIcon />
                <span>{item.trim().replace(/^✅\s*/, "")}</span>
              </li>
            )
        )}
      </ul>
    );
  };

  const accordionItems = [
    {
      title: "Description",
      content: (
        <div className="whitespace-pre-wrap">{product.description}</div>
      ),
      key: "description",
    },
    {
      title: "Benefits",
      content: renderListContent(product.benefits),
      key: "benefits",
    },
    {
      title: "What's in the box",
      content: renderListContent(product.box_contents),
      key: "box_contents",
    },
  ];

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          {/* Image Gallery */}
          <div className="md:col-span-2">
            <div className="relative w-full h-[32rem] bg-slate-100 rounded-lg overflow-hidden shadow-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full"
                >
                  <Image
                    src={mainImage!}
                    alt={product.name}
                    fill
                    className="object-cover object-bottom"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMainImage(img)}
                  className={`relative w-full h-20 bg-slate-100 rounded-md overflow-hidden border-2 transition-colors ${
                    mainImage === img
                      ? "border-[hsl(var(--swago-purple))]"
                      : "border-transparent"
                  }`}
                  aria-label={`View ${product.name} image ${index + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover object-bottom"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="md:col-span-3">
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-bold">{product.name}</h1>
              <button
                onClick={handleWishlistClick}
                className="p-2"
                aria-label="Toggle Wishlist"
              >
                {isLiked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-[hsl(var(--swago-pink))]"
                  >
                    <path d="M11.645 20.91a.75.75 0 0 1-1.29 0C8.125 18.172 4.5 14.51 4.5 10.5c0-2.897 2.353-5.25 5.25-5.25c.928 0 1.78.243 2.508.663c.728-.42 1.58-.663 2.508-.663c2.897 0 5.25 2.353 5.25 5.25c0 4.01-3.625 7.672-5.855 10.41a.75.75 0 0 1-1.29 0Z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-slate-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="mt-2">
              <span className="inline-flex items-center bg-[hsl(var(--swago-teal))] text-white text-sm font-semibold px-3 py-1 rounded-full">
                Age: {product.age_category}
              </span>
            </div>

            <p className="text-3xl font-bold text-slate-900 my-4">
              ₹{product.price}
              {product.original_price && (
                <span className="text-xl text-slate-400 line-through ml-2">
                  ₹{product.original_price}
                </span>
              )}
            </p>

            <div className="flex items-center gap-4 mb-6">
              <label className="font-semibold">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 text-lg"
                >
                  -
                </button>
                <span className="px-4 py-2 text-lg">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-2 text-lg"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => addToCart(product, quantity)}
                className="btn-shine flex-1 bg-[hsl(var(--swago-purple))] text-white font-bold py-3 rounded-lg text-base"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="btn-shine flex-1 bg-[hsl(var(--swago-orange))] text-white font-bold py-3 rounded-lg text-base"
              >
                Buy It Now
              </button>
            </div>

            <div className="mt-8">
              {accordionItems.map((item) =>
                (product.benefits &&
                  item.key === "benefits" &&
                  product.benefits.trim() !== "") ||
                (product.box_contents &&
                  item.key === "box_contents" &&
                  product.box_contents.trim() !== "") ||
                item.key === "description" ? (
                  <AccordionItem
                    key={item.key}
                    title={item.title}
                    content={item.content}
                    isOpen={openAccordion === item.key}
                    onToggle={() =>
                      setOpenAccordion(
                        openAccordion === item.key ? null : item.key
                      )
                    }
                  />
                ) : null
              )}
            </div>
          </div>
        </div>

        {/* ✅ NEW: Reviews Section */}
        <div className="mt-16 border-t pt-12">
          <ReviewList 
            productId={product.id} 
            currentUserId={user?.phone} 
          />
        </div>
      </div>

      <div className="text-center pt-8 pb-16">
        <Link
          href="/products"
          className="btn-shine inline-block bg-[hsl(var(--swago-teal))] text-white font-bold px-8 py-3 rounded-full shadow-lg"
        >
          View More Products
        </Link>
      </div>
    </>
  );
}