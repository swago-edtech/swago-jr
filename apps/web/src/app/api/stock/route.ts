import { NextResponse } from "next/server";
import { connectDB, Product, getConfiguredProductIds, applyEffectiveProductStock, getEffectiveAvailableStock } from "@swago/database";
import { isValidObjectId } from "mongoose";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json({ success: true, stock: {} });
    }

    const ids = idsParam.split(",").filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, stock: {} });
    }

    await connectDB();

    const configuredIds = await getConfiguredProductIds();
    const objectIds = ids.filter((id) => isValidObjectId(id));
    const slugs = ids.filter((id) => !isValidObjectId(id));

    const orConditions: Record<string, unknown>[] = [];
    if (objectIds.length) orConditions.push({ _id: { $in: objectIds } });
    if (slugs.length) orConditions.push({ slug: { $in: slugs } });

    const products = await Product.find({ $or: orConditions })
      .select("_id slug stock reservedStock")
      .lean() as Array<{
        _id: { toString(): string };
        slug?: string;
        stock?: number;
        reservedStock?: number;
      }>;

    const stockMap: Record<string, { available: number; reserved: number; total: number }> = {};

    for (const product of products) {
      const id = product._id.toString();
      const hasConfig = configuredIds.has(id);
      const effective = applyEffectiveProductStock(product, configuredIds);
      const total = effective.stock ?? 0;
      const entry = {
        available: getEffectiveAvailableStock(effective, hasConfig),
        reserved: 0,
        total,
      };

      stockMap[product._id.toString()] = entry;
      if (product.slug) {
        stockMap[product.slug] = entry;
      }
    }

    return NextResponse.json({ success: true, stock: stockMap });
  } catch (error) {
    console.error("Error fetching stock:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch stock",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
