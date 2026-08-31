import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB, Product, ProductConfig } from "@swago/database";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const products = await Product.find({ isActive: true })
      .select("name price images stock")
      .sort({ name: 1 })
      .lean();

    const configs = await ProductConfig.find().lean();
    
    const configMap = new Map(
      configs.map((config: any) => [config.productId.toString(), config])
    );

    const productsWithConfig = products.map((product: any) => {
      const config = configMap.get(product._id.toString());
      return {
        ...product,
        hasConfig: !!config,
        componentCount: config ? config.components.length : 0,
      };
    });

    return NextResponse.json({ success: true, products: productsWithConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
