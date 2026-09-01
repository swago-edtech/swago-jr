import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { connectDB, Product, ProductConfig, getConfiguredProductIds, applyEffectiveProductStock } from "@swago/database";

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

    const configuredIds = await getConfiguredProductIds();

    const staleUnconfiguredIds = products
      .filter((p: any) => !configuredIds.has(p._id.toString()) && (p.stock ?? 0) > 0)
      .map((p: any) => p._id);

    if (staleUnconfiguredIds.length > 0) {
      await Product.updateMany({ _id: { $in: staleUnconfiguredIds } }, { stock: 0 });
    }

    const productsWithConfig = products.map((product: any) => {
      const hasConfig = configuredIds.has(product._id.toString());
      const config = configMap.get(product._id.toString());
      return {
        ...applyEffectiveProductStock(product, configuredIds),
        hasConfig,
        componentCount: config?.components?.length ?? 0,
      };
    });

    return NextResponse.json({ success: true, products: productsWithConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
