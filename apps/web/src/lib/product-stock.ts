import {
  getConfiguredProductIds,
  applyEffectiveProductStock,
  enrichProductAvailability,
  getEffectiveAvailableStock,
  Product,
} from "@swago/database";
import { isValidObjectId } from "mongoose";

export { getEffectiveAvailableStock, enrichProductAvailability };

export async function withEffectiveProductStock<
  T extends { _id: { toString(): string } | string; stock?: number; reservedStock?: number },
>(product: T): Promise<T & { availableStock: number; hasConfig: boolean }> {
  const configuredIds = await getConfiguredProductIds();
  return enrichProductAvailability(product, configuredIds);
}

export async function findProductByIdOrSlug(id: string) {
  let product = await Product.findOne({ slug: id, isActive: true });
  if (!product && isValidObjectId(id)) {
    product = await Product.findOne({ _id: id, isActive: true });
  }
  return product;
}

export async function findProductWithAvailability(id: string) {
  const product = await findProductByIdOrSlug(id);
  if (!product) return null;
  const plain = product.toObject ? product.toObject() : product;
  return withEffectiveProductStock(plain);
}
