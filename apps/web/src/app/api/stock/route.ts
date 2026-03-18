import { NextResponse } from "next/server";
import { connectDB, Product } from "@swago/database";

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

    const products = await Product.find({ _id: { $in: ids } })
      .select("_id stock")
      .lean() as Array<{ _id: { toString(): string }; stock?: number }>;

    const stockMap: Record<string, { available: number; reserved: number; total: number }> = {};

    for (const product of products) {
      const total = product.stock ?? 0;
      stockMap[product._id.toString()] = {
        available: total,
        reserved: 0,
        total,
      };
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
