import { NextResponse } from "next/server";
import { connectDB, Product } from "@swago/database";
import { products as hardcodedProducts } from "@swago/utils";
import { isValidObjectId } from "mongoose";
import { getProductCache, getCacheTTL } from "@/lib/productCache";

// ✅ Define product type to handle both DB and hardcoded products
interface ProductResponse {
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
  stock?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

// ✅ UPDATED: Use shared cache from utility
const productCache = getProductCache();
const CACHE_TTL = getCacheTTL();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check cache
    const cached = productCache.get(slug);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Product cache hit: ${slug}`);
      const response = NextResponse.json({
        success: true,
        product: cached.data
      });
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return response;
    }

    // Connect to database
    await connectDB();

    let product: ProductResponse | null = null;

    // Try slug-based lookup first
    product = await Product.findOne({
      slug: slug,
      isActive: true
    })
      .select("-__v")
      .lean() as ProductResponse | null;

    // If not found by slug, try MongoDB _id (only if valid ObjectId format)
    if (!product && isValidObjectId(slug)) {
      product = await Product.findOne({
        _id: slug,
        isActive: true
      })
        .select("-__v")
        .lean() as ProductResponse | null;
    }

    // Fallback to hardcoded products for old numeric IDs (backward compatibility)
    if (!product && !isNaN(Number(slug))) {
      const hardcoded = hardcodedProducts.find(p => p.id === parseInt(slug));
      if (hardcoded) {
        console.log(`Using hardcoded product for ID: ${slug}`);
        // Convert hardcoded product to new format
        product = {
          _id: `hardcoded-${hardcoded.id}`,
          name: hardcoded.name,
          description: hardcoded.description,
          price: hardcoded.price,
          originalPrice: hardcoded.original_price,
          images: hardcoded.images,
          ageCategory: hardcoded.age_category,
          coreElements: hardcoded.core_elements,
          benefits: hardcoded.benefits,
          boxContents: hardcoded.box_contents,
          stock: 100, // Default stock for hardcoded products
          isFeatured: false,
          isActive: true,
          slug: `product-${hardcoded.id}`
        };
      }
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Store in cache
    productCache.set(slug, {
      data: product,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (productCache.size > 200) {
      const now = Date.now();
      for (const [key, value] of productCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
          productCache.delete(key);
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      product: product
    });

    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch product",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
