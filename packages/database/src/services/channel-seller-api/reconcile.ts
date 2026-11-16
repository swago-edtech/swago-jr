/**
 * Bounded Flipkart outstanding-shipment reconciliation.
 *
 * Official v3 filter dates are orderDate / cancellationDate / dispatch* — not a
 * documented modifiedDate. Status-only changes on older open shipments are
 * revisited via GET /sellers/v3/shipments?shipmentIds= (or orderIds=), not the
 * buyer-address path GET /v3/shipments/{ids}.
 *
 * Historic backfill is still the first-run 30-day window: orders never seen in
 * that window are not added to the watchlist.
 */

import {
  FLIPKART_API_ORIGIN,
  FLIPKART_OUTSTANDING_CAP,
  FLIPKART_RECONCILE_BATCH,
  FLIPKART_RECONCILE_MAX_REQUESTS,
  FLIPKART_SHIPMENTS_LOOKUP_PATH,
} from "./types";

function flipkartOrderKey(orderId: string): string {
  const raw = String(orderId || "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "");
  if (!raw) return "";
  return raw.startsWith("FK-") ? raw : `FK-${raw}`;
}

export type OutstandingShipment = {
  shipmentId?: string;
  orderId?: string;
  orderKey: string;
  firstSeenAt: string;
  lastCheckedAt?: string;
};

export const FLIPKART_TERMINAL_ITEM_STATUSES = new Set([
  "CANCELLED",
  "DELIVERED",
  "PICKUP_COMPLETE",
  "RETURNED",
]);

const SAFE_ID = /^[A-Za-z0-9._:-]{1,80}$/;

export function sanitizeFlipkartLookupId(id: unknown): string {
  const raw = String(id || "").trim();
  return SAFE_ID.test(raw) ? raw : "";
}

export function isFlipkartTerminalShipment(shipment: any): boolean {
  const items = Array.isArray(shipment?.orderItems) ? shipment.orderItems : [];
  if (!items.length) {
    const status = String(shipment?.status || shipment?.shipmentStatus || "").toUpperCase();
    return FLIPKART_TERMINAL_ITEM_STATUSES.has(status);
  }
  return items.every((item: any) => {
    const status = String(item?.status || "").toUpperCase();
    return FLIPKART_TERMINAL_ITEM_STATUSES.has(status) || !!item?.cancellationDate;
  });
}

export function collectOutstandingFromShipments(shipments: any[], nowIso: string): OutstandingShipment[] {
  const out: OutstandingShipment[] = [];
  const seen = new Set<string>();
  for (const shipment of shipments || []) {
    if (isFlipkartTerminalShipment(shipment)) continue;
    const shipmentId = sanitizeFlipkartLookupId(shipment?.shipmentId);
    const orderIds: string[] = [];
    for (const item of Array.isArray(shipment?.orderItems) ? shipment.orderItems : []) {
      const id = sanitizeFlipkartLookupId(item?.orderId);
      if (id && !orderIds.includes(id)) orderIds.push(id);
    }
    const orderId = orderIds[0] || sanitizeFlipkartLookupId(shipment?.orderId);
    if (!shipmentId && !orderId) continue;
    const key = shipmentId ? `s:${shipmentId}` : `o:${orderId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      shipmentId: shipmentId || undefined,
      orderId: orderId || undefined,
      orderKey: flipkartOrderKey(orderId || shipmentId),
      firstSeenAt: nowIso,
    });
  }
  return out;
}

function rowKey(row: OutstandingShipment): string {
  if (row.shipmentId) return `s:${row.shipmentId}`;
  if (row.orderId) return `o:${row.orderId}`;
  return `k:${row.orderKey}`;
}

export function mergeOutstanding(
  previous: OutstandingShipment[] | null | undefined,
  discovered: OutstandingShipment[],
  cap = FLIPKART_OUTSTANDING_CAP
): { next: OutstandingShipment[]; overflow: number } {
  const byKey = new Map<string, OutstandingShipment>();
  for (const row of previous || []) {
    const key = rowKey(row);
    if (key === "k:") continue;
    byKey.set(key, { ...row });
  }
  for (const row of discovered || []) {
    const key = rowKey(row);
    if (key === "k:") continue;
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, {
        ...prev,
        shipmentId: row.shipmentId || prev.shipmentId,
        orderId: row.orderId || prev.orderId,
        orderKey: row.orderKey || prev.orderKey,
        firstSeenAt: prev.firstSeenAt || row.firstSeenAt,
      });
    } else {
      byKey.set(key, { ...row });
    }
  }
  const all = [...byKey.values()].sort((a, b) => String(a.firstSeenAt).localeCompare(String(b.firstSeenAt)));
  if (all.length <= cap) return { next: all, overflow: 0 };
  return { next: all.slice(all.length - cap), overflow: all.length - cap };
}

export function selectOutstandingBatch(
  rows: OutstandingShipment[],
  batchSize = FLIPKART_RECONCILE_BATCH,
  maxRequests = FLIPKART_RECONCILE_MAX_REQUESTS
): { shipmentIds: string[]; orderIds: string[] } {
  const limit = Math.max(0, batchSize) * Math.max(0, maxRequests);
  const ordered = [...(rows || [])].sort((a, b) =>
    String(a.lastCheckedAt || "").localeCompare(String(b.lastCheckedAt || ""))
  );
  const shipmentIds: string[] = [];
  const orderIds: string[] = [];
  for (const row of ordered) {
    if (shipmentIds.length + orderIds.length >= limit) break;
    if (row.shipmentId) {
      if (!shipmentIds.includes(row.shipmentId)) shipmentIds.push(row.shipmentId);
    } else if (row.orderId && !orderIds.includes(row.orderId)) {
      orderIds.push(row.orderId);
    }
  }
  return { shipmentIds, orderIds };
}

export function chunkIds(ids: string[], size = FLIPKART_RECONCILE_BATCH): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/** Official lookup URL. Never the PII path /v3/shipments/{ids}. */
export function flipkartShipmentsLookupUrl(kind: "shipmentIds" | "orderIds", ids: string[]): string | null {
  const clean = ids.map(sanitizeFlipkartLookupId).filter(Boolean);
  if (!clean.length) return null;
  const url = new URL(FLIPKART_SHIPMENTS_LOOKUP_PATH, FLIPKART_API_ORIGIN);
  url.searchParams.set(kind, clean.join(","));
  return url.toString();
}

export function refreshOutstandingAfterLookup(opts: {
  previous: OutstandingShipment[];
  lookedUpShipments: any[];
  lookedUpShipmentIds: string[];
  lookedUpOrderIds: string[];
  nowIso: string;
  cap?: number;
}): { next: OutstandingShipment[]; overflow: number } {
  const terminalKeys = new Set<string>();
  for (const shipment of opts.lookedUpShipments || []) {
    if (!isFlipkartTerminalShipment(shipment)) continue;
    const shipmentId = sanitizeFlipkartLookupId(shipment?.shipmentId);
    if (shipmentId) terminalKeys.add(`s:${shipmentId}`);
    for (const item of Array.isArray(shipment?.orderItems) ? shipment.orderItems : []) {
      const orderId = sanitizeFlipkartLookupId(item?.orderId);
      if (orderId) terminalKeys.add(`o:${orderId}`);
    }
  }
  const stillOpen = collectOutstandingFromShipments(opts.lookedUpShipments || [], opts.nowIso);
  const lookedUp = new Set<string>([
    ...opts.lookedUpShipmentIds.map((id) => `s:${id}`),
    ...opts.lookedUpOrderIds.map((id) => `o:${id}`),
  ]);
  const kept: OutstandingShipment[] = [];
  for (const row of opts.previous || []) {
    const key = rowKey(row);
    if (terminalKeys.has(key) || (row.orderId && terminalKeys.has(`o:${row.orderId}`))) continue;
    if (lookedUp.has(key)) {
      kept.push({ ...row, lastCheckedAt: opts.nowIso });
    } else {
      kept.push(row);
    }
  }
  return mergeOutstanding(kept, stillOpen, opts.cap);
}
