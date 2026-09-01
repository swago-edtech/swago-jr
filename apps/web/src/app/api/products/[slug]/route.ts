// apps/web/src/app/api/products/[slug]/route.ts
import { NextResponse } from "next/server";
import { connectDB, Product, getConfiguredProductIds, applyEffectiveProductStock } from "@swago/database";
import { isValidObjectId } from "mongoose";

interface ProductResponse {
  _id?: string;
  id?: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  ageCategory: string;
  coreElements: string[];
  benefits?: string;
  boxContents?: string;
  stock?: number;
  reservedStock?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    await connectDB();

    let product: ProductResponse | null = null;

    product = await Product.findOne({
      slug,
      isActive: true,
    })
      .select("-__v")
      .lean() as ProductResponse | null;

    if (!product && isValidObjectId(slug)) {
      product = await Product.findOne({
        _id: slug,
        isActive: true,
      })
        .select("-__v")
        .lean() as ProductResponse | null;
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (product._id) {
      product._id = product._id.toString();
    }

    const configuredIds = await getConfiguredProductIds();
    product = applyEffectiveProductStock(product, configuredIds);

    const response = NextResponse.json({
      success: true,
      product,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch product",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
