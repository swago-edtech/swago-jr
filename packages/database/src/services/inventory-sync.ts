import mongoose from "mongoose";
import ProductConfig from "../models/ProductConfig";
import InventoryItem from "../models/InventoryItem";
import Product from "../models/Product";

type PopulatedInventoryItem = {
  currentStock?: number;
  name?: string;
  isActive?: boolean;
};

type BomComponent = {
  quantity: number;
  inventoryItemName?: string;
  inventoryItemId?: PopulatedInventoryItem | null;
};

export interface BomStockResult {
  stock: number;
  limitingComponent: string | null;
}

export function calculateBomStock(components: BomComponent[]): BomStockResult {
  if (!components?.length) {
    return { stock: 0, limitingComponent: null };
  }

  let maxPossible = Infinity;
  let limitingComponent: string | null = null;

  for (const comp of components) {
    const item = comp.inventoryItemId;
    const requiredQty = comp.quantity;

    if (!item || item.isActive === false || requiredQty <= 0) {
      return {
        stock: 0,
        limitingComponent: item?.name ?? comp.inventoryItemName ?? null,
      };
    }

    const available = item.currentStock ?? 0;
    const possibleWithThis = Math.floor(available / requiredQty);

    if (possibleWithThis < maxPossible) {
      maxPossible = possibleWithThis;
      limitingComponent = item.name ?? comp.inventoryItemName ?? null;
    }
  }

  if (maxPossible === Infinity) {
    maxPossible = 0;
  }

  return { stock: maxPossible, limitingComponent };
}

export async function hasActiveBomConfig(
  productId: string | mongoose.Types.ObjectId
): Promise<boolean> {
  const config = await ProductConfig.findOne({ productId, isActive: true })
    .select("components")
    .lean();
  return !!(config?.components?.length);
}

/**
 * Recalculates and persists stock for a single product.
 * BOM-configured products get calculated stock; unconfigured products are set to 0.
 */
export async function syncProductStock(
  productId: string | mongoose.Types.ObjectId
): Promise<BomStockResult> {
  const config = await ProductConfig.findOne({ productId, isActive: true }).populate({
    path: "components.inventoryItemId",
    model: InventoryItem,
  });

  if (!config?.components?.length) {
    await Product.findByIdAndUpdate(productId, { stock: 0 });
    return { stock: 0, limitingComponent: null };
  }

  const result = calculateBomStock(config.components);
  await Product.findByIdAndUpdate(productId, { stock: result.stock });
  return result;
}

export async function getConfiguredProductIds(): Promise<Set<string>> {
  const configs = await ProductConfig.find({
    isActive: true,
    "components.0": { $exists: true },
  })
    .select("productId")
    .lean();

  return new Set(configs.map((c) => c.productId.toString()));
}

export function applyEffectiveProductStock<
  T extends { _id: { toString(): string } | string; stock?: number },
>(product: T, configuredIds: Set<string>): T {
  const id = typeof product._id === "string" ? product._id : product._id.toString();
  if (!configuredIds.has(id)) {
    return { ...product, stock: 0 };
  }
  return product;
}

/**
 * Recalculates stock for every active product (BOM-derived or zeroed).
 */
export async function syncAllProductStock(): Promise<number> {
  const products = await Product.find({ isActive: true }).select("_id");

  for (const product of products) {
    await syncProductStock(product._id);
  }

  return products.length;
}

/** @deprecated Use syncAllProductStock */
export async function syncAllBomProducts(): Promise<number> {
  const configs = await ProductConfig.find({ isActive: true }).select("productId");
  let synced = 0;

  for (const config of configs) {
    if (config.components?.length) {
      await syncProductStock(config.productId);
      synced += 1;
    }
  }

  return synced;
}

/**
 * Recalculates and updates the stock of all products that utilize any of the provided inventory items.
 */
export async function syncAffectedProducts(inventoryItemIds: string[]) {
  if (!inventoryItemIds?.length) return;

  try {
    const affectedConfigs = await ProductConfig.find({
      isActive: true,
      "components.inventoryItemId": { $in: inventoryItemIds },
    }).select("productId");

    if (!affectedConfigs.length) return;

    const productIds = [...new Set(affectedConfigs.map((c) => c.productId.toString()))];

    for (const productId of productIds) {
      await syncProductStock(productId);
    }
  } catch (error) {
    console.error("⚠️ Failed to sync affected products:", error);
  }
}
