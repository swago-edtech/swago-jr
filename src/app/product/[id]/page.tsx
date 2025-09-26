"use client";

import { useState, use } from "react"; // 1. Import 'use' from React
import { products } from "@/lib/products";
import { useSharedContext } from "@/context/SharedContext";
import Link from "next/link";

// 2. The 'params' prop is now typed as a Promise
export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 3. We 'unwrap' the promise to get the id
  const { id } = use(params);

  const product = products.find(p => p.id === parseInt(id));
  const [mainImage, setMainImage] = useState(product?.images[0]);
  const { addToCart } = useSharedContext();

  if (!product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link href="/products" className="text-blue-600 hover:underline mt-4 inline-block">Back to all products</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Gallery */}
        <div>
          <div className="w-full h-96 bg-slate-100 rounded-lg overflow-hidden">
            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {product.images.map((img, index) => (
              <button key={index} onClick={() => setMainImage(img)} className={`w-full h-24 rounded-md overflow-hidden border-2 ${mainImage === img ? 'border-[hsl(var(--swago-purple))]' : 'border-transparent'}`}>
                <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold">{product.name}</h1>
          <p className="text-slate-500 mt-2">Age Category: {product.age_category}</p>
          <p className="text-3xl font-bold text-slate-900 my-4">₹{product.price}</p>
          <p className="text-slate-600 leading-relaxed">{product.description}</p>
          <div className="mt-6">
            <button 
              onClick={() => addToCart(product)} 
              className="w-full bg-[hsl(var(--swago-pink))] text-white font-bold py-4 rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}