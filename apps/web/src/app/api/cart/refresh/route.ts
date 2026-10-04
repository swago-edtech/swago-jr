// apps/web/src/app/api/cart/refresh/route.ts
// Refreshes cart items with current product details from the database.
// Returns updated items + a list of changes so the frontend can notify the user.
import { NextResponse } from "next/server";
import { connectDB, Product } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { withEffectiveProductStock } from "@/lib/product-stock";

interface RefreshRequestItem {
  productId: string;
  quantity: number;
  price: number;       // Current frontend price (to detect changes)
  name?: string;       // Current frontend name (to detect changes)
}

interface PriceChange {
  productId: string;
  productName: string;
  field: string;
  oldValue: string | number;
  newValue: string | number;
}

interface RemovedItem {
  productId: string;
  name: string;
  reason: string;
}

// Helper to find product by slug or ObjectId
async function findProduct(productId: string) {
  // Try slug first
  let product = await Product.findOne({ slug: productId, isActive: true })
    .select("_id name price originalPrice images stock reservedStock isActive slug")
    .lean();

  // Try MongoDB _id if valid ObjectId
  if (!product && isValidObjectId(productId)) {
    product = await Product.findOne({ _id: productId, isActive: true })
      .select("_id name price originalPrice images stock reservedStock isActive slug")
      .lean();
  }

  return product;
}

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Items array is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const refreshedItems: any[] = [];
    const changes: PriceChange[] = [];
    const removedItems: RemovedItem[] = [];

    for (const item of items as RefreshRequestItem[]) {
      const { productId, quantity, price: frontendPrice, name: frontendName } = item;

      if (!productId) continue;

      const product = await findProduct(productId);

      if (!product) {
        // Product no longer exists or is inactive
        removedItems.push({
          productId,
          name: frontendName || productId,
          reason: "Product is no longer available",
        });
        continue;
      }

      const dbProduct = await withEffectiveProductStock(product as any);
      const dbPrice = dbProduct.price;
      const dbName = dbProduct.name;
      const availableStock = dbProduct.availableStock ?? 0;

      // Detect price changes
      if (frontendPrice !== undefined && frontendPrice !== dbPrice) {
        changes.push({
          productId,
          productName: dbName,
          field: "price",
          oldValue: frontendPrice,
          newValue: dbPrice,
        });
      }

      // Detect name changes
      if (frontendName && frontendName !== dbName) {
        changes.push({
          productId,
          productName: dbName,
          field: "name",
          oldValue: frontendName,
          newValue: dbName,
        });
      }

      // Stock decoupled: no longer detect stock issues
      // Build refreshed item with current DB data
      refreshedItems.push({
        productId: dbProduct.slug || dbProduct._id.toString(),
        _id: dbProduct._id.toString(),
        slug: dbProduct.slug,
        name: dbName,
        price: dbPrice,
        originalPrice: dbProduct.originalPrice || undefined,
        images: dbProduct.images || ["/images/placeholder.png"],
        stock: dbProduct.stock ?? 0,
        availableStock,
        isActive: dbProduct.isActive,
        quantity, // Stock decoupled: keep whatever quantity they had
      });
    }

    return NextResponse.json({
      success: true,
      items: refreshedItems,
      changes,
      removedItems,
      hasChanges: changes.length > 0 || removedItems.length > 0,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing cart:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refresh cart",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
