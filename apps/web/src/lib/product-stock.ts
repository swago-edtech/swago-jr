import { getConfiguredProductIds, applyEffectiveProductStock } from "@swago/database";

let configuredIdsCache: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

async function getCachedConfiguredProductIds(): Promise<Set<string>> {
  if (configuredIdsCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return configuredIdsCache;
  }

  configuredIdsCache = await getConfiguredProductIds();
  cacheTimestamp = Date.now();
  return configuredIdsCache;
}

export async function withEffectiveProductStock<
  T extends { _id: { toString(): string } | string; stock?: number },
>(product: T): Promise<T> {
  const configuredIds = await getCachedConfiguredProductIds();
  return applyEffectiveProductStock(product, configuredIds);
}

export function getEffectiveAvailableStock(product: {
  stock?: number;
  reservedStock?: number;
}): number {
  const stock = product.stock ?? 0;
  const reserved = product.reservedStock ?? 0;
  return Math.max(0, stock - reserved);
}
