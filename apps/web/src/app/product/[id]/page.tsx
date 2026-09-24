import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";
import { notFound } from "next/navigation";
import { connectDB, Product, getConfiguredProductIds } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { enrichProductAvailability } from "@/lib/product-stock";
import { Suspense } from "react";

// On-demand only: avoids enumerating every product during `next build` (OOM on 4GB boxes)
export const dynamic = "force-dynamic";

// Fetch product directly from DB
async function getProduct(id: string) {
  try {
    await connectDB();
    
    let product = await Product.findOne({
      slug: id,
      isActive: true
    }).select("-__v").lean();

    if (!product && isValidObjectId(id)) {
      product = await Product.findOne({
        _id: id,
        isActive: true
      }).select("-__v").lean();
    }

    if (product) {
       const configuredIds = await getConfiguredProductIds();
       const enriched = enrichProductAvailability(
         JSON.parse(JSON.stringify(product)),
         configuredIds
       );
       return enriched;
    }
  } catch (error) {
    console.error('Error fetching product from DB:', error);
  }

  return null;
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

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 animate-pulse bg-slate-100 h-[600px] rounded-2xl" />}>
      <ProductPageClient product={product} />
    </Suspense>
  );
}
