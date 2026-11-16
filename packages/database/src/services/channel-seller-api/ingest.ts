/**
 * Map a normalised seller API sale onto the existing ChannelStockOrder / ledger / ChannelOrder path.
 * Amazon uses the same order key as email sync. A trusted API source is authoritative for current
 * quantity (partial cancels can reduce). Email MAX is used only when no trusted API source exists.
 * Double-cut of the same units is still prevented by the ledger (desired - already cut).
 */

import { getOrCreateChannelEmailConfig } from "../channel-email-sync";
import { matchChannelProducts } from "../channel-inventory";
import { recordChannelOrderApiSource, syncChannelOrderStock, type OrderLine } from "../channel-ledger";
import { upsertChannelOrderFromApiSale } from "../channel-order";
import type { SellerSale } from "./types";

export type IngestDeps = {
  getConfig?: () => Promise<{ productAliases?: any[] }>;
  matchProducts?: (
    items: Array<{ title: string; quantity: number; sku: string }>,
    aliases: any[]
  ) => Promise<{ matched: any[]; unmatched: string[] }>;
  recordSource?: typeof recordChannelOrderApiSource;
  syncStock?: typeof syncChannelOrderStock;
  upsertSale?: typeof upsertChannelOrderFromApiSale;
};

export type IngestResult = {
  orderKey: string;
  status: "ingested" | "cancelled" | "reviewed" | "skipped" | "error";
  note: string;
  unmatched: string[];
};

export function linesForStock(sale: SellerSale, matched: OrderLine[]): OrderLine[] {
  if (sale.cancelled) return [];
  return matched.filter((l) => l.quantity > 0);
}

/** Pure decision used by tests: when to trust, write sales, and run stock sync. */
export function planIngestActions(input: {
  autoApply: boolean;
  cancelled: boolean;
  needsReview: boolean;
  liveMatched: number;
  unmatched: number;
}): { canTrust: boolean; runStockSync: boolean; upsertSales: boolean; clearReview: boolean } {
  const canTrust = input.autoApply && input.liveMatched > 0 && input.unmatched === 0 && !input.cancelled;
  const runStockSync = canTrust || input.cancelled;
  // Do not record unmatched rows as Confirmed sales. FBA / replacement / return holds may still
  // appear as sales when every line matched, without cutting stock.
  const upsertSales = runStockSync || (input.needsReview && input.unmatched === 0 && input.liveMatched > 0);
  const clearReview = canTrust && !input.needsReview;
  return { canTrust, runStockSync, upsertSales, clearReview };
}

/** Stock outcomes that must not be treated as a successful ingest (checkpoint must not advance). */
export function isStockSyncFailure(status: string | undefined): boolean {
  return status === "error" || status === "busy" || status === "needs_repair" || status === "review";
}

export async function ingestSellerApiSale(sale: SellerSale, deps: IngestDeps = {}): Promise<IngestResult> {
  if (!sale.orderKey || !sale.externalOrderId) {
    return { orderKey: "", status: "skipped", note: "Missing marketplace order id", unmatched: [] };
  }

  const extracted = sale.items.map((item) => ({
    title: item.title,
    quantity: Math.max(0, item.quantity),
    sku: item.sku,
  }));

  const config = await (deps.getConfig || getOrCreateChannelEmailConfig)();
  const { matched, unmatched } = await (deps.matchProducts || matchChannelProducts)(
    extracted.filter((i) => i.quantity > 0),
    config.productAliases || []
  );

  const liveMatched: OrderLine[] = (matched || []).map((m) => ({
    productId: String(m.productId),
    productName: m.productName || "",
    quantity: Math.max(0, Math.floor(Number(m.quantity) || 0)),
  }));

  const unmatchedLabels = unmatched || [];
  const reasons: string[] = [];
  if (sale.reviewReason) reasons.push(sale.reviewReason);
  if (unmatchedLabels.length) reasons.push(`Unmatched SKU/title: ${unmatchedLabels.join(", ")}`);

  const decision = planIngestActions({
    autoApply: sale.autoApply,
    cancelled: sale.cancelled,
    needsReview: sale.needsReview,
    liveMatched: liveMatched.length,
    unmatched: unmatchedLabels.length,
  });
  const trustedLines = linesForStock(sale, liveMatched);

  await (deps.recordSource || recordChannelOrderApiSource)({
    orderKey: sale.orderKey,
    externalOrderId: sale.externalOrderId,
    channel: sale.platform,
    sourceKey: sale.sourceKey,
    lines: trustedLines,
    trusted: decision.canTrust,
    cancelled: sale.cancelled,
    needsReview: decision.clearReview ? false : sale.needsReview || !decision.canTrust && !sale.cancelled,
    note: reasons.join("; "),
    by: `seller-api:${sale.platform}`,
  });

  if (decision.runStockSync) {
    const sync = await (deps.syncStock || syncChannelOrderStock)(sale.orderKey, { by: `seller-api:${sale.platform}` });
    if (decision.upsertSales) {
      await (deps.upsertSale || upsertChannelOrderFromApiSale)({
        channel: sale.platform,
        externalOrderId: sale.externalOrderId,
        items: liveMatched,
        status: sale.cancelled ? "Cancelled" : "Confirmed",
        receivedAt: sale.occurredAt,
        inventorySnapshot: sync.snapshot,
      });
    }
    if (isStockSyncFailure(sync.status)) {
      return { orderKey: sale.orderKey, status: "error", note: sync.note || "Stock sync failed", unmatched: unmatchedLabels };
    }
    return {
      orderKey: sale.orderKey,
      status: sale.cancelled ? "cancelled" : "ingested",
      note: sync.note || reasons.join("; "),
      unmatched: unmatchedLabels,
    };
  }

  if (decision.upsertSales) {
    await (deps.upsertSale || upsertChannelOrderFromApiSale)({
      channel: sale.platform,
      externalOrderId: sale.externalOrderId,
      items: liveMatched,
      status: sale.cancelled ? "Cancelled" : "Confirmed",
      receivedAt: sale.occurredAt,
    });
  }

  return {
    orderKey: sale.orderKey,
    status: "reviewed",
    note: reasons.join("; ") || "Held for review",
    unmatched: unmatchedLabels,
  };
}
