/**
 * Flipkart Marketplace Seller APIs — read-only order ingestion.
 *
 * Auth: self-access client_credentials, scope Seller_Api, Basic(appId:appSecret)
 *   GET https://api.flipkart.net/oauth-service/oauth/token
 *
 * Orders: POST /sellers/v3/shipments/filter/ (pageSize max 20), then GET nextPageUrl.
 * Default serviceProfiles NON_FBF (FA/FBF orders are not returned).
 * Cancelled, preDispatch, and postDispatch (NORMAL and SELF) are separate filters.
 *
 * Returns: GET /sellers/v2/returns (source is mandatory) — recorded for review only.
 * No stock restore is inferred from returns.
 */

import { sellerApiQueryStart } from "./checkpoint";
import { readFlipkartCredentials } from "./config";
import { requestJson, SellerApiHttpError, type FetchLike, type RequestJsonOptions } from "./http";
import {
  chunkIds,
  collectOutstandingFromShipments,
  flipkartShipmentsLookupUrl,
  mergeOutstanding,
  refreshOutstandingAfterLookup,
  selectOutstandingBatch,
  type OutstandingShipment,
} from "./reconcile";
import { dedupeSales } from "./shared";
import {
  FLIPKART_API_ORIGIN,
  FLIPKART_PAGE_SIZE,
  FLIPKART_RETURNS_PATH,
  FLIPKART_SCOPE,
  FLIPKART_SHIPMENTS_FILTER_PATH,
  FLIPKART_TOKEN_PATH,
  SELLER_API_MAX_PAGES,
  TOKEN_EXPIRY_SKEW_MS,
  type SellerApiResume,
  type SellerLine,
  type SellerSale,
} from "./types";

export type TokenCache = { accessToken: string; expiresAt: number };
const tokenCache: TokenCache = { accessToken: "", expiresAt: 0 };

export function resetFlipkartTokenCache() {
  tokenCache.accessToken = "";
  tokenCache.expiresAt = 0;
}

export function flipkartOrderKey(orderId: unknown): string {
  const raw = String(orderId || "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "");
  if (!raw) return "";
  return raw.startsWith("FK-") ? raw : `FK-${raw}`;
}

export function flipkartExternalId(orderId: unknown): string {
  return String(orderId || "")
    .trim()
    .toUpperCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "")
    .replace(/^FK-/, "");
}

const ALLOWED_HOSTS = new Set(["api.flipkart.net"]);

/** Only follow Flipkart pagination URLs on the official API host. */
export function resolveFlipkartNextUrl(next: unknown): string | null {
  const raw = String(next || "").trim();
  if (!raw) return null;
  try {
    const url = raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(raw.startsWith("/") ? raw : `/${raw}`, FLIPKART_API_ORIGIN);
    if (url.protocol !== "https:") {
      url.protocol = "https:";
    }
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    // Official list/docs sometimes omit /sellers on nextPageUrl path; keep as returned if already under /sellers or /oauth.
    return url.toString();
  } catch {
    return null;
  }
}

type TokenResponse = { access_token?: string; expires_in?: number };

export async function fetchFlipkartAccessToken(
  creds: { appId: string; appSecret: string },
  opts: RequestJsonOptions = {},
  cache: TokenCache = tokenCache,
  now = Date.now()
): Promise<string> {
  if (cache.accessToken && cache.expiresAt - TOKEN_EXPIRY_SKEW_MS > now) {
    return cache.accessToken;
  }
  const basic = Buffer.from(`${creds.appId}:${creds.appSecret}`).toString("base64");
  const url = `${FLIPKART_API_ORIGIN}${FLIPKART_TOKEN_PATH}?grant_type=client_credentials&scope=${encodeURIComponent(FLIPKART_SCOPE)}`;
  const { data } = await requestJson<TokenResponse>(
    url,
    { method: "GET", headers: { Authorization: `Basic ${basic}`, accept: "application/json" } },
    opts
  );
  const accessToken = String(data?.access_token || "").trim();
  if (!accessToken) throw new Error("Flipkart token response was missing access_token");
  const expiresIn = Number(data.expires_in);
  cache.accessToken = accessToken;
  cache.expiresAt = now + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 3600_000);
  return accessToken;
}

const CANCELLED_STATUSES = new Set(["CANCELLED"]);
const RETURN_STATUSES = new Set(["RETURN_REQUESTED", "RETURNED"]);

export function mapFlipkartOrderItem(item: any): SellerLine | null {
  const orderId = item?.orderId;
  if (!orderId && !item?.sku && !item?.orderItemId) return null;
  const status = String(item?.status || "").toUpperCase();
  const cancelled = CANCELLED_STATUSES.has(status) || !!item?.cancellationDate;
  const qty = Math.max(0, Math.floor(Number(item?.quantity) || 0));
  return {
    sku: String(item?.sku || "").trim(),
    title: String(item?.title || item?.sku || "").trim(),
    quantity: cancelled ? 0 : qty,
    orderItemId: String(item?.orderItemId || "").trim() || undefined,
    cancelled,
    isReplacement: item?.isReplacement === true,
    status,
  };
}

type MutableSale = SellerSale & { itemById: Map<string, SellerLine> };

function saleBucket(orderId: string): MutableSale {
  const externalOrderId = flipkartExternalId(orderId);
  const orderKey = flipkartOrderKey(orderId);
  return {
    platform: "flipkart",
    externalOrderId,
    orderKey,
    items: [],
    cancelled: false,
    autoApply: true,
    needsReview: false,
    reviewReason: "",
    sourceKey: `api:flipkart:${orderKey}`,
    itemById: new Map(),
  };
}


export const FLIPKART_FILTER_IDS = [
  "preDispatch",
  "postDispatch:NORMAL",
  "postDispatch:SELF",
  "cancelled:marketplaceCancellation",
  "cancelled:sellerCancellation",
  "cancelled:buyerCancellation",
  "returns:customer_return",
  "returns:courier_return",
] as const;

export function applyFlipkartReturnFlag(sale: SellerSale, source: string, item: any): void {
  const id = item?.returnId ?? "";
  const note = `Return ${id} (${source}, ${item?.status || "unknown"})`.replace(/Return  /, "Return ");
  sale.needsReview = true;
  sale.autoApply = false;
  sale.reviewReason = sale.reviewReason ? `${sale.reviewReason}; ${note}` : note;
}

export function reviewOnlyFlipkartReturnSale(orderId: string, source: string, item: any): SellerSale {
  const sale = saleBucket(orderId);
  delete (sale as Partial<MutableSale>).itemById;
  sale.items = [];
  sale.cancelled = false;
  sale.autoApply = false;
  sale.needsReview = true;
  sale.reviewReason = "";
  applyFlipkartReturnFlag(sale, source, item);
  const updated = parseIso(item?.modifiedAt || item?.updatedAt || item?.returnDate);
  if (updated) sale.updatedAt = updated;
  return sale;
}

/**
 * Merge shipment items into per-order sales.
 * Later statuses overwrite the same orderItemId (cancelled wins if both seen).
 */
export function mergeFlipkartShipments(shipments: any[], into: Map<string, MutableSale>) {
  for (const shipment of shipments || []) {
    const items = Array.isArray(shipment?.orderItems) ? shipment.orderItems : [];
    for (const raw of items) {
      const line = mapFlipkartOrderItem(raw);
      const orderId = String(raw?.orderId || "").trim();
      if (!line || !orderId) continue;
      const key = flipkartOrderKey(orderId);
      if (!key) continue;
      let sale = into.get(key);
      if (!sale) {
        sale = saleBucket(orderId);
        into.set(key, sale);
      }
      const occurred = parseIso(raw?.orderDate) || parseIso(shipment?.updatedAt);
      if (occurred && (!sale.occurredAt || occurred < sale.occurredAt)) sale.occurredAt = occurred;
      const updated = parseIso(shipment?.updatedAt) || parseIso(raw?.cancellationDate) || occurred;
      if (updated && (!sale.updatedAt || updated > sale.updatedAt)) sale.updatedAt = updated;

      const itemKey = line.orderItemId || `${line.sku}:${line.status}:${sale.itemById.size}`;
      const prev = sale.itemById.get(itemKey);
      if (!prev) sale.itemById.set(itemKey, line);
      else sale.itemById.set(itemKey, preferLine(prev, line));
    }
  }
}

function preferLine(a: SellerLine, b: SellerLine): SellerLine {
  // Prefer cancelled / returned over an earlier live status for the same item.
  const rank = (l: SellerLine) => {
    const s = String(l.status || "").toUpperCase();
    if (CANCELLED_STATUSES.has(s) || l.cancelled) return 3;
    if (RETURN_STATUSES.has(s)) return 2;
    return 1;
  };
  return rank(b) >= rank(a) ? b : a;
}

export function finalizeFlipkartSales(into: Map<string, MutableSale>): SellerSale[] {
  const out: SellerSale[] = [];
  for (const sale of into.values()) {
    sale.items = [...sale.itemById.values()];
    delete (sale as Partial<MutableSale>).itemById;
    const hasReturn = sale.items.some((i) => RETURN_STATUSES.has(String(i.status || "").toUpperCase()));
    const hasReplacement = sale.items.some((i) => i.isReplacement);
    const allCancelled =
      sale.items.length > 0 && sale.items.every((i) => i.cancelled || i.quantity <= 0);
    const reasons: string[] = [];
    if (hasReplacement) reasons.push("Contains a replacement item — not auto-applied");
    if (hasReturn) reasons.push("Return reported — recorded for review, stock not auto-restored");
    sale.cancelled = allCancelled && !hasReturn;
    sale.needsReview = reasons.length > 0;
    sale.reviewReason = reasons.join("; ");
    sale.autoApply =
      !sale.cancelled && !hasReplacement && !hasReturn && sale.items.some((i) => i.quantity > 0);
    out.push(sale);
  }
  return out;
}

function parseIso(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function flipkartDateWindow(checkpoint: string | null | undefined, now: Date): { from: string; to: string } {
  const from = sellerApiQueryStart({ checkpoint, now });
  return { from: from.toISOString(), to: now.toISOString() };
}

type FilterBody = Record<string, unknown>;

function preDispatchBody(from: string, to: string): FilterBody {
  return {
    filter: {
      type: "preDispatch",
      states: ["APPROVED", "PACKING_IN_PROGRESS", "PACKED", "FORM_FAILED", "READY_TO_DISPATCH"],
      orderDate: { from, to },
    },
    pagination: { pageSize: FLIPKART_PAGE_SIZE },
  };
}

function postDispatchBody(from: string, to: string, shipmentType: "NORMAL" | "SELF"): FilterBody {
  return {
    filter: {
      type: "postDispatch",
      states: ["SHIPPED", "DELIVERED", "PICKUP_COMPLETE"],
      shipmentTypes: [shipmentType],
      orderDate: { from, to },
    },
    pagination: { pageSize: FLIPKART_PAGE_SIZE },
  };
}

function cancelledBody(from: string, to: string, cancellationType: string): FilterBody {
  return {
    filter: {
      type: "cancelled",
      states: ["CANCELLED"],
      cancellationType,
      cancellationDate: { from, to },
    },
    pagination: { pageSize: FLIPKART_PAGE_SIZE },
  };
}

export type FlipkartPollResult = {
  sales: SellerSale[];
  pages: number;
  skipped: number;
  returnsFlagged: number;
  checkpoint: string;
  truncated: boolean;
  windowStart: string;
  windowEnd: string;
  resume: SellerApiResume | null;
  outstanding: OutstandingShipment[];
  outstandingOverflow: number;
};

export async function pollFlipkartOrders(
  opts: {
    checkpoint?: string | null;
    now?: Date;
    fetchImpl?: FetchLike;
    tokenCache?: TokenCache;
    maxPages?: number;
    resume?: SellerApiResume | null;
    outstanding?: OutstandingShipment[] | null;
  } = {}
): Promise<FlipkartPollResult> {
  const creds = readFlipkartCredentials();
  if (!creds) throw new Error("Flipkart seller API is not configured");
  const now = opts.now || new Date();
  const resuming = !!(opts.resume?.windowStart && opts.resume?.windowEnd);
  const { from, to } = resuming
    ? { from: opts.resume!.windowStart, to: opts.resume!.windowEnd }
    : flipkartDateWindow(opts.checkpoint, now);
  const pendingCursors = new Map(
    (resuming ? opts.resume?.flipkartCursors || [] : []).map((c) => [c.id, c.nextUrl])
  );
  const shouldRun = (id: string) => !resuming || pendingCursors.has(id);
  const reqOpts: RequestJsonOptions = { fetchImpl: opts.fetchImpl };
  const cache = opts.tokenCache || tokenCache;
  const maxPages = opts.maxPages ?? SELLER_API_MAX_PAGES;

  const authed = async (url: string, init: RequestInit) => {
    const token = await fetchFlipkartAccessToken(creds, reqOpts, cache, now.getTime());
    const headers = { ...(init.headers || {}), Authorization: `Bearer ${token}`, accept: "application/json" };
    try {
      return await requestJson<any>(url, { ...init, headers }, reqOpts);
    } catch (error) {
      if (error instanceof SellerApiHttpError && error.status === 401) {
        cache.accessToken = "";
        cache.expiresAt = 0;
        const retried = await fetchFlipkartAccessToken(creds, reqOpts, cache, now.getTime() + 1);
        return requestJson<any>(url, { ...init, headers: { ...headers, Authorization: `Bearer ${retried}` } }, reqOpts);
      }
      throw error;
    }
  };

  const into = new Map<string, MutableSale>();
  const rawShipments: any[] = [];
  let pages = 0;
  let truncated = false;
  const nextCursors: Array<{ id: string; nextUrl: string }> = [];

  const paginateFilter = async (id: string, body: FilterBody) => {
    if (!shouldRun(id)) return;
    let used = 0;
    const resumeUrl = resuming ? resolveFlipkartNextUrl(pendingCursors.get(id)) : null;
    const firstUrl = `${FLIPKART_API_ORIGIN}${FLIPKART_SHIPMENTS_FILTER_PATH}`;
    let data: any;
    if (resumeUrl) {
      const nextRes = await authed(resumeUrl, { method: "GET" });
      data = nextRes.data;
    } else {
      const first = await authed(firstUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      data = first.data;
    }
    used += 1;
    pages += 1;
    mergeFlipkartShipments(data?.shipments, into);
    if (Array.isArray(data?.shipments)) rawShipments.push(...data.shipments);
    while (data?.hasMore && used < maxPages) {
      const next = resolveFlipkartNextUrl(data?.nextPageUrl);
      if (!next) {
        truncated = true;
        break;
      }
      const nextRes = await authed(next, { method: "GET" });
      data = nextRes.data;
      used += 1;
      pages += 1;
      mergeFlipkartShipments(data?.shipments, into);
      if (Array.isArray(data?.shipments)) rawShipments.push(...data.shipments);
    }
    if (data?.hasMore) {
      truncated = true;
      const next = resolveFlipkartNextUrl(data?.nextPageUrl);
      if (next) nextCursors.push({ id, nextUrl: next });
      else if (resumeUrl) nextCursors.push({ id, nextUrl: resumeUrl });
    }
  };

  await paginateFilter("preDispatch", preDispatchBody(from, to));
  await paginateFilter("postDispatch:NORMAL", postDispatchBody(from, to, "NORMAL"));
  await paginateFilter("postDispatch:SELF", postDispatchBody(from, to, "SELF"));
  for (const cancellationType of ["marketplaceCancellation", "sellerCancellation", "buyerCancellation"]) {
    await paginateFilter(`cancelled:${cancellationType}`, cancelledBody(from, to, cancellationType));
  }

  let outstandingOverflow = 0;
  const lookedUpShipmentIds: string[] = [];
  const lookedUpOrderIds: string[] = [];
  const lookedUpShipments: any[] = [];
  const nowIso = to;
  let discovered = collectOutstandingFromShipments(rawShipments, nowIso);
  let outstandingMerge = mergeOutstanding(opts.outstanding || [], discovered);
  outstandingOverflow += outstandingMerge.overflow;
  const batch = selectOutstandingBatch(outstandingMerge.next);
  const lookupKind = async (kind: "shipmentIds" | "orderIds", ids: string[]) => {
    for (const chunk of chunkIds(ids)) {
      const url = flipkartShipmentsLookupUrl(kind, chunk);
      if (!url) continue;
      const { data } = await authed(url, { method: "GET" });
      pages += 1;
      const shipments = Array.isArray(data?.shipments) ? data.shipments : [];
      mergeFlipkartShipments(shipments, into);
      rawShipments.push(...shipments);
      lookedUpShipments.push(...shipments);
      if (kind === "shipmentIds") lookedUpShipmentIds.push(...chunk);
      else lookedUpOrderIds.push(...chunk);
    }
  };
  try {
    await lookupKind("shipmentIds", batch.shipmentIds);
    await lookupKind("orderIds", batch.orderIds);
  } catch (error) {
    // Keep the watchlist; date-window ingestion still stands. Do not invent drops.
    console.error("Flipkart outstanding shipment lookup failed", error instanceof Error ? error.message : error);
  }
  discovered = collectOutstandingFromShipments(rawShipments, nowIso);
  outstandingMerge = refreshOutstandingAfterLookup({
    previous: mergeOutstanding(opts.outstanding || [], discovered).next,
    lookedUpShipments,
    lookedUpShipmentIds,
    lookedUpOrderIds,
    nowIso,
  });
  outstandingOverflow += outstandingMerge.overflow;

  const sales = finalizeFlipkartSales(into);
  let returnsFlagged = 0;
  try {
    returnsFlagged = await flagFlipkartReturns({
      authed, from, to, sales, maxPages,
      shouldRun,
      resumeUrl: (id) => (resuming ? pendingCursors.get(id) : undefined),
      addPages: (n) => { pages += n; },
      onTruncated: (id, nextUrl) => {
        truncated = true;
        if (nextUrl) nextCursors.push({ id, nextUrl });
      },
    });
  } catch (error) {
    // Returns are best-effort; shipment ingestion still stands. Surface via a review note on the run.
    for (const sale of sales) {
      if (!sale.needsReview) {
        sale.needsReview = true;
        sale.reviewReason = sale.reviewReason
          ? `${sale.reviewReason}; returns poll failed`
          : `Returns poll failed: ${error instanceof Error ? error.message : "unknown error"}`;
      }
    }
  }

  const candidate = truncated ? String(opts.checkpoint || "") : to;
  const resume: SellerApiResume | null = truncated
    ? { windowStart: from, windowEnd: to, flipkartCursors: nextCursors }
    : null;
  return {
    sales: dedupeSales(sales),
    pages,
    skipped: 0,
    returnsFlagged,
    checkpoint: candidate,
    truncated,
    windowStart: from,
    windowEnd: to,
    resume,
    outstanding: outstandingMerge.next,
    outstandingOverflow,
  };
}

async function flagFlipkartReturns(input: {
  authed: (url: string, init: RequestInit) => Promise<{ data: any }>;
  from: string;
  to: string;
  sales: SellerSale[];
  maxPages: number;
  shouldRun?: (id: string) => boolean;
  resumeUrl?: (id: string) => string | undefined;
  addPages: (n: number) => void;
  onTruncated?: (id: string, nextUrl: string | null) => void;
}): Promise<number> {
  const byOrder = new Map(input.sales.map((s) => [s.orderKey, s]));
  let flagged = 0;
  for (const source of ["customer_return", "courier_return"]) {
    const id = `returns:${source}`;
    if (input.shouldRun && !input.shouldRun(id)) continue;
    const first = `${FLIPKART_API_ORIGIN}${FLIPKART_RETURNS_PATH}?source=${encodeURIComponent(source)}&modifiedAfter=${encodeURIComponent(input.from)}&modifiedBefore=${encodeURIComponent(input.to)}`;
    const resumed = resolveFlipkartNextUrl(input.resumeUrl?.(id));
    let url: string | null = resumed || first;
    let used = 0;
    let lastUrl = url;
    while (url && used < input.maxPages) {
      lastUrl = url;
      const { data } = await input.authed(url, { method: "GET" });
      used += 1;
      input.addPages(1);
      const items = Array.isArray(data?.returnItems) ? data.returnItems : [];
      for (const item of items) {
        const orderId = String(item?.orderId || "").trim();
        if (!orderId) continue;
        const key = flipkartOrderKey(orderId);
        let sale = byOrder.get(key);
        if (!sale) {
          sale = reviewOnlyFlipkartReturnSale(orderId, source, item);
          byOrder.set(key, sale);
          input.sales.push(sale);
        } else {
          applyFlipkartReturnFlag(sale, source, item);
        }
        flagged += 1;
      }
      if (data?.hasMore) {
        const next = resolveFlipkartNextUrl(data?.nextUrl);
        if (!next || used >= input.maxPages) {
          input.onTruncated?.(id, next || lastUrl);
          url = null;
        } else {
          url = next;
        }
      } else {
        url = null;
      }
    }
  }
  return flagged;
}
