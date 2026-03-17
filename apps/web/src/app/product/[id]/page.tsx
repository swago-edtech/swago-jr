import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";
import { notFound } from "next/navigation";
import { connectDB, Product } from "@swago/database";
import { isValidObjectId } from "mongoose";

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
       // Convert _id to string for serialization
       return JSON.parse(JSON.stringify(product));
    }
  } catch (error) {
    console.error('Error fetching product from DB:', error);
  }

  return null;
}

export async function generateStaticParams() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).select("slug _id").lean();
    
    return products.map((product: any) => ({
      id: product.slug || product._id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params from DB:', error);
  }
  return [];
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
