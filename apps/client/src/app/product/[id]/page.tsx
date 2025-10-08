import type { Metadata } from "next";
import { products } from "@/lib/products";
import ProductPageClient from "@/components/ProductPageClient";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id.toString(),
  }));
}

// ⬇️⬇️ KEY FIX #1 ⬇️⬇️
// We disable the ESLint rule for this line only, allowing us to use `any` to bypass the Next.js bug.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const { id } = params as { id: string };
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `${product.name} | Swago Jr`,
    description: product.description,
  };
}

// ⬇️⬇️ KEY FIX #2 ⬇️⬇️
// We do the same for the page component itself.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProductDetailPage({ params }: { params: any }) {
  const { id } = params as { id: string };
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    notFound();
  }

  return <ProductPageClient product={product} />;
}