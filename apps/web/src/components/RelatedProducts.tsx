"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/context/SharedContext";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";

interface RelatedProductsProps {
  currentProductId: string;
  ageCategory?: string;
}

export default function RelatedProducts({ currentProductId, ageCategory }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products
        const response = await fetch("/api/products");
        const data = await response.json();

        if (data.success) {
          // Show all products (including current one)
          setProducts(data.products.slice(0, 8));
        }
      } catch (error) {
        console.error("Error fetching related products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [currentProductId, ageCategory]);

  if (loading) {
    return (
      <div className="mt-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[hsl(var(--swago-purple))] border-r-transparent"></div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-20 border-t pt-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
          Parents <span className="text-[hsl(var(--swago-purple))]">love</span> these products
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Other parents also chose these smart boxes for their children. Explore our most popular learning experiences.
        </p>
      </div>

      <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {products.map((product, index) => (
          <motion.div
            key={product._id || product.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[calc(25%-1.15rem)] snap-start"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
