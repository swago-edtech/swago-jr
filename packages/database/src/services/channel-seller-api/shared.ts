import type { SellerSale } from "./types";

/** Prefer the last occurrence of an order in this poll (later page / later update). */
export function dedupeSales(sales: SellerSale[]): SellerSale[] {
  const map = new Map<string, SellerSale>();
  for (const sale of sales) map.set(sale.orderKey, sale);
  return [...map.values()];
}
