import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { Product, getConfiguredProductIds, applyEffectiveProductStock } from "@swago/database";
import { connectDB } from "@swago/database";

// GET /api/products - List all products with filters
export async function GET(request: NextRequest) {
  try {
    // ✅ Check admin authentication (your JWT auth)
    await requireAdmin();

    await connectDB();

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const ageCategory = searchParams.get("ageCategory");
    const stockStatus = searchParams.get("stockStatus");
    const isActive = searchParams.get("isActive");
    const isFeatured = searchParams.get("isFeatured");

    // Build query filter
    const filter: any = {};

    // Search by name
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // Filter by age category
    if (ageCategory && ageCategory !== "all") {
      filter.ageCategory = ageCategory;
    }

    // Filter by stock status
    if (stockStatus && stockStatus !== "all") {
      if (stockStatus === "out-of-stock") {
        filter.stock = 0;
      } else if (stockStatus === "low-stock") {
        filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
        filter.stock = { $gt: 0 };
      } else if (stockStatus === "in-stock") {
        filter.$expr = { $gt: ["$stock", "$lowStockThreshold"] };
      }
    }

    // Filter by active status
    if (isActive !== null && isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    // Filter by featured status
    if (isFeatured === "true") {
      filter.isFeatured = true;
    }

    const configuredIds = await getConfiguredProductIds();

    // Fetch products
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const staleUnconfiguredIds = products
      .filter((p: any) => !configuredIds.has(p._id.toString()) && (p.stock ?? 0) > 0)
      .map((p: any) => p._id);

    if (staleUnconfiguredIds.length > 0) {
      await Product.updateMany({ _id: { $in: staleUnconfiguredIds } }, { stock: 0 });
    }

    const productsWithEffectiveStock = products.map((product: any) => {
      const hasConfig = configuredIds.has(product._id.toString());
      return {
        ...applyEffectiveProductStock(product, configuredIds),
        hasConfig,
      };
    });

    return NextResponse.json({
      success: true,
      products: productsWithEffectiveStock,
      count: productsWithEffectiveStock.length,
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);

    // Handle unauthorized error
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    // ✅ Check admin authentication
    await requireAdmin();

    await connectDB();

    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "price",
      "ageCategory",
      "coreElements",
      "boxContents",
      "benefits",
      "images",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate images array
    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    // Validate coreElements array
    if (!Array.isArray(body.coreElements) || body.coreElements.length === 0) {
      return NextResponse.json(
        { error: "At least one core element is required" },
        { status: 400 }
      );
    }

    // Create product
    const product = await Product.create({
      name: body.name,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      images: body.images,
      videos: body.videos || [],
      ageCategory: body.ageCategory,
      coreElements: body.coreElements,
      boxContents: body.boxContents,
      benefits: body.benefits,
      stock: 0,
      lowStockThreshold: body.lowStockThreshold || 10,
      isFeatured: body.isFeatured || false,
      isActive: body.isActive !== undefined ? body.isActive : true,
      label: body.label || "",
      rating: body.rating || 0,
      numReviews: body.numReviews || 0,
      showPromotionalMessage: body.showPromotionalMessage || false,
      promotionalMessage: body.promotionalMessage || "",
      skills: body.skills || [],
    });

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);

    // Handle unauthorized error
    if (error.message === 'Unauthorized - Admin access required') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle duplicate slug error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A product with similar name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
