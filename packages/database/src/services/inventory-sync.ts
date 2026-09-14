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
  const config = (await ProductConfig.findOne({ productId, isActive: true })
    .select("components")
    .lean()) as { components?: unknown[] } | null;
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
 * BOM-configured products: stock field is the source of truth (component allocation
 * is tracked separately). Unconfigured products are never purchasable.
 * Legacy reservedStock is ignored — it caused false negatives and negative-reserved bugs.
 */
export function getEffectiveAvailableStock(
  product: { stock?: number; reservedStock?: number },
  isConfigured: boolean
): number {
  if (!isConfigured) return 0;
  return Math.max(0, product.stock ?? 0);
}

export function enrichProductAvailability<
  T extends { _id: { toString(): string } | string; stock?: number; reservedStock?: number },
>(product: T, configuredIds: Set<string>): T & { availableStock: number; hasConfig: boolean } {
  const id = typeof product._id === "string" ? product._id : product._id.toString();
  const hasConfig = configuredIds.has(id);
  const effective = applyEffectiveProductStock(product, configuredIds);
  return {
    ...effective,
    hasConfig,
    availableStock: getEffectiveAvailableStock(effective, hasConfig),
  };
}

/**
 * Zero stale DB values: unconfigured products with leftover stock, and any negative reservedStock.
 */
export async function reconcileStaleProductStock(): Promise<{
  zeroedUnconfigured: number;
  fixedReserved: number;
}> {
  const configuredIds = await getConfiguredProductIds();
  const products = await Product.find({ isActive: true })
    .select("_id stock reservedStock")
    .lean() as Array<{
      _id: mongoose.Types.ObjectId;
      stock?: number;
      reservedStock?: number;
    }>;

  const zeroedUnconfiguredIds: mongoose.Types.ObjectId[] = [];
  const fixedReservedIds: mongoose.Types.ObjectId[] = [];

  for (const product of products) {
    const id = product._id.toString();
    const isConfigured = configuredIds.has(id);

    if (!isConfigured && (product.stock ?? 0) > 0) {
      zeroedUnconfiguredIds.push(product._id);
    }
    if ((product.reservedStock ?? 0) !== 0) {
      fixedReservedIds.push(product._id);
    }
  }

  if (zeroedUnconfiguredIds.length > 0) {
    await Product.updateMany({ _id: { $in: zeroedUnconfiguredIds } }, { stock: 0 });
  }
  if (fixedReservedIds.length > 0) {
    await Product.updateMany({ _id: { $in: fixedReservedIds } }, { reservedStock: 0 });
  }

  return {
    zeroedUnconfigured: zeroedUnconfiguredIds.length,
    fixedReserved: fixedReservedIds.length,
  };
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
    throw error;
  }
}
