import { NextResponse } from "next/server";
import { connectDB, Product, getConfiguredProductIds, applyEffectiveProductStock } from "@swago/database";

interface ProductData {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  ageCategory: string;
  coreElements: string[];
  benefits?: string;
  boxContents?: string;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

interface ProductQuery {
  isActive: boolean;
  name?: { $regex: string; $options: string };
  ageCategory?: string;
  coreElements?: { $all: string[] };
  isFeatured?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const age = searchParams.get("age") || "";
    const elements = searchParams.get("elements") || "";
    const featured = searchParams.get("featured") === "true";

    await connectDB();

    const query: ProductQuery = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (age) {
      query.ageCategory = age;
    }

    if (elements) {
      const elementArray = elements.split(",").filter(Boolean);
      if (elementArray.length > 0) {
        query.coreElements = { $all: elementArray };
      }
    }

    if (featured) {
      query.isFeatured = true;
    }

    const configuredIds = await getConfiguredProductIds();

    const products = await Product.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean() as unknown as ProductData[];

    const productsWithEffectiveStock = products.map((product) =>
      applyEffectiveProductStock(product, configuredIds)
    );

    const response = NextResponse.json({
      success: true,
      products: productsWithEffectiveStock,
      count: productsWithEffectiveStock.length,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
