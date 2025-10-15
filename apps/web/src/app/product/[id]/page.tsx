import type { Metadata } from "next";
import { products } from "@swago/utils"; // 🔥 BONUS: Using shared package
import ProductPageClient from "@/components/ProductPageClient";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id.toString(),
  }));
}

// ✅ FIXED: Async params for Next.js 15
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  const { id } = await params; // 🔥 Await params
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `${product.name} | Swago Jr`,
    description: product.description,
  };
}

// ✅ FIXED: Async component with awaited params
export default async function ProductDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params; // 🔥 Await params
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}