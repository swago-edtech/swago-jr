"use client";
import React from "react";
// Updated import
import { Product, useSharedContext } from "@/context/SharedContext";
export default function ProductCard({ product }: { product: Product }) {
  // Updated hook
  const { addToCart } = useSharedContext();
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg transition">
      <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded" />
      <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
      <p className="text-sm text-gray-600">{product.description}</p>
      <p className="mt-2 font-bold">₹{product.price}</p>
      <button onClick={() => addToCart(product)} className="mt-3 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
        Add to Cart
      </button>
    </div>
  );
}