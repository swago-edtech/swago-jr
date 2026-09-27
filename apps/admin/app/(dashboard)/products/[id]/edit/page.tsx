"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "@/components/ProductForm";

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  videos?: string[];
  ageCategory: string;
  coreElements: string[];
  boxContents: string;
  benefits: string;
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
  isCombo?: boolean;
  comboUnitCount?: number;
  comboProductIds?: string[];
  label?: string;
  rating?: number;
  numReviews?: number;
  showPromotionalMessage?: boolean;
  promotionalMessage?: string;
  skills?: { title: string; image: string }[];
  internationalPricing?: Record<string, { price: number; originalPrice?: number }>;
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.product);
        } else {
          alert("Failed to load product");
          router.push("/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to load product");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-600 font-medium">Product not found</p>
      </div>
    );
  }

  return <ProductForm mode="edit" initialData={product} productId={productId} />;
}
