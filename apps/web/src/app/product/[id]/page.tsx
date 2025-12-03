import type { Metadata } from "next";
// ========================================
// 🔴 TEMPORARY: Remove this import after full migration
import { products as hardcodedProducts } from "@swago/utils";
// ========================================
import ProductPageClient from "@/components/ProductPageClient";
import { notFound } from "next/navigation";

// ========================================
// ✅ KEEP: Fetch product from API
async function getProduct(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/${id}`, {
      cache: 'no-store' // Always get fresh product data (stock changes)
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return data.product;
      }
    }
  } catch (error) {
    console.error('Error fetching product:', error);
  }
  
  // ========================================
  // 🔴 TEMPORARY: Fallback to hardcoded products
  // After migration, remove this fallback and return null
  const hardcoded = hardcodedProducts.find((p) => p.id === parseInt(id));
  return hardcoded || null;
  // ========================================
}
// ========================================

export async function generateStaticParams() {
  // ========================================
  // 🔴 TEMPORARY: Generate params for hardcoded products
  // After migration, fetch from API:
  /*
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`);
    const data = await res.json();
    if (data.success) {
      return data.products.map((product: any) => ({
        id: product.slug || product._id,
      }));
    }
  } catch (error) {
    console.error('Error generating static params:', error);
  }
  return [];
  */
  return hardcodedProducts.map((product) => ({
    id: product.id.toString(),
  }));
  // ========================================
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product Not Found" };
  }
  
  return {
    title: `${product.name} | Swago Jr`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}
