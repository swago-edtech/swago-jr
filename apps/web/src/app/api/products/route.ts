import { NextResponse } from "next/server";
import { connectDB, Product } from "@swago/database";

// ✅ Type definition for product data
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

// ✅ Type definition for query filter
interface ProductQuery {
  isActive: boolean;
  name?: { $regex: string; $options: string };
  ageCategory?: string;
  coreElements?: { $all: string[] };
  isFeatured?: boolean;
}

// Cache for product listings
const listCache = new Map<string, { data: ProductData[]; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache for product lists

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get("search") || "";
    const age = searchParams.get("age") || "";
    const elements = searchParams.get("elements") || "";
    const featured = searchParams.get("featured") === "true";

    // Create cache key
    const cacheKey = `${search}-${age}-${elements}-${featured}`;
    const cached = listCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Product list cache hit: ${cacheKey}`);
      const response = NextResponse.json({
        success: true,
        products: cached.data,
        count: cached.data.length
      });
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return response;
    }

    // Connect to database
    await connectDB();

    // ✅ Build query with proper typing
    const query: ProductQuery = { isActive: true };

    // Search filter
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Age category filter
    if (age) {
      query.ageCategory = age;
    }

    // Core elements filter (all selected elements must be present)
    if (elements) {
      const elementArray = elements.split(",").filter(Boolean);
      if (elementArray.length > 0) {
        query.coreElements = { $all: elementArray };
      }
    }

    // Featured filter
    if (featured) {
      query.isFeatured = true;
    }

    // Fetch products
    const products = await Product.find(query)
      .select("-__v") // Exclude version key
      .sort({ createdAt: -1 })
      .lean() as unknown as ProductData[];


    // Store in cache
    listCache.set(cacheKey, {
      data: products,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    if (listCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of listCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
          listCache.delete(key);
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      products: products,
      count: products.length
    });

    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    return response;
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch products",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
