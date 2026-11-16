/**
 * Amazon SP-API Orders v2026-01-01 (India / EU endpoint).
 * Read-only searchOrders. No BUYER/RECIPIENT (PII) datasets. No shipment writes.
 *
 * Auth: LWA refresh_token grant at api.amazon.com; calls use x-amz-access-token only
 * (AWS SigV4 is not required for current SP-API).
 */

import { normalizeChannelOrderId } from "../channel-email-parse";
import { readAmazonCredentials } from "./config";
import { formUrlEncoded, requestJson, SellerApiHttpError, type FetchLike, type RequestJsonOptions } from "./http";
import { sellerApiQueryStart } from "./checkpoint";
import { dedupeSales } from "./shared";
import {
  AMAZON_INDIA_MARKETPLACE_ID,
  AMAZON_LWA_TOKEN_URL,
  AMAZON_ORDERS_PATH,
  AMAZON_PAGE_SIZE,
  AMAZON_SP_ENDPOINT,
  AMAZON_USER_AGENT,
  SELLER_API_MAX_PAGES,
  TOKEN_EXPIRY_SKEW_MS,
  type SellerApiResume,
  type SellerSale,
} from "./types";

export type TokenCache = { accessToken: string; expiresAt: number };

const tokenCache: TokenCache = { accessToken: "", expiresAt: 0 };

export function resetAmazonTokenCache() {
  tokenCache.accessToken = "";
  tokenCache.expiresAt = 0;
}

type LwaTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

export async function fetchAmazonAccessToken(
  creds: { clientId: string; clientSecret: string; refreshToken: string },
  opts: RequestJsonOptions = {},
  cache: TokenCache = tokenCache,
  now = Date.now()
): Promise<string> {
  if (cache.accessToken && cache.expiresAt - TOKEN_EXPIRY_SKEW_MS > now) {
    return cache.accessToken;
  }
  const { data } = await requestJson<LwaTokenResponse>(
    AMAZON_LWA_TOKEN_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: formUrlEncoded({
        grant_type: "refresh_token",
        refresh_token: creds.refreshToken,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      }),
    },
    opts
  );
  const accessToken = String(data?.access_token || "").trim();
  if (!accessToken) throw new Error("Amazon LWA token response was missing access_token");
  const expiresIn = Number(data.expires_in);
  cache.accessToken = accessToken;
  cache.expiresAt = now + (Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn * 1000 : 3600_000);
  return accessToken;
}

export function amazonOrderKey(orderId: unknown): string {
  return normalizeChannelOrderId(orderId);
}

export function isAmazonReplacementOrder(order: any): boolean {
  const associated = Array.isArray(order?.associatedOrders) ? order.associatedOrders : [];
  return associated.some((a: any) => {
    const t = String(a?.associationType || "").toUpperCase();
    return t === "REPLACEMENT_ORIGINAL_ID" || t === "EXCHANGE_ORIGINAL_ID";
  });
}

/**
 * Official ItemCancellationExecution has only cancelledBy + cancelReason — no cancelled
 * or remaining quantity. Do not invent qty from quantityFulfilled / quantityUnfulfilled
 * (those are shipment remaining, not cancelled remaining).
 *
 * Safe auto-zero only when the whole order is CANCELLED/UNFULFILLABLE, or the line's
 * documented quantityOrdered is already 0. Any other execution is review-only and
 * keeps quantityOrdered so prior stock is not auto-restored.
 */
export type AmazonItemStockPlan = {
  quantity: number;
  lineCancelled: boolean;
  ambiguousCancel: boolean;
  reason?: string;
};

export function planAmazonItemStock(item: any, orderFulfillmentStatus = ""): AmazonItemStockPlan {
  const ordered = Math.max(0, Math.floor(Number(item?.quantityOrdered) || 0));
  const status = String(orderFulfillmentStatus || "").toUpperCase();
  const orderCancelled = status === "CANCELLED" || status === "UNFULFILLABLE";
  const hasExecution = !!item?.cancellation?.cancellationExecution;
  if (orderCancelled) return { quantity: 0, lineCancelled: true, ambiguousCancel: false };
  if (!hasExecution) return { quantity: ordered, lineCancelled: false, ambiguousCancel: false };
  if (ordered <= 0) return { quantity: 0, lineCancelled: true, ambiguousCancel: false };
  return {
    quantity: ordered,
    lineCancelled: false,
    ambiguousCancel: true,
    reason:
      "Cancellation executed but official payload has no remaining/cancelled quantity — stock left unchanged pending review",
  };
}

export function isAmazonItemCancelled(item: any, orderFulfillmentStatus = ""): boolean {
  return planAmazonItemStock(item, orderFulfillmentStatus).lineCancelled;
}

export function hasAmazonCancellationRequestOnly(item: any): boolean {
  return !!item?.cancellation?.cancellationRequest && !item?.cancellation?.cancellationExecution;
}

export function amazonItemQuantity(item: any, orderFulfillmentStatus = ""): number {
  return planAmazonItemStock(item, orderFulfillmentStatus).quantity;
}

export function mapAmazonOrder(order: any): SellerSale | null {
  const rawId = String(order?.orderId || "").trim();
  const orderKey = amazonOrderKey(rawId);
  if (!orderKey) return null;

  const fulfillment = order?.fulfillment || {};
  const status = String(fulfillment.fulfillmentStatus || "").toUpperCase();
  const fulfilledBy = String(fulfillment.fulfilledBy || "").toUpperCase();
  const itemsIn = Array.isArray(order?.orderItems) ? order.orderItems : [];
  const plans: AmazonItemStockPlan[] = itemsIn.map((item: any) => planAmazonItemStock(item, status));
  const items = itemsIn.map((item: any, idx: number) => ({
    sku: String(item?.product?.sellerSku || "").trim(),
    title: String(item?.product?.title || "").trim(),
    quantity: plans[idx].quantity,
    orderItemId: String(item?.orderItemId || "").trim() || undefined,
    cancelled: plans[idx].lineCancelled,
    isReplacement: false,
    status,
  }));

  const allCancelled =
    status === "CANCELLED" ||
    status === "UNFULFILLABLE" ||
    (items.length > 0 && items.every((i: SellerSale["items"][number]) => i.cancelled || i.quantity <= 0));

  const isReplacement = isAmazonReplacementOrder(order);
  const isFba = fulfilledBy === "AMAZON";
  const isPreorder = status === "PENDING_AVAILABILITY";
  const emptyLive = !allCancelled && (items.length === 0 || !items.some((i: SellerSale["items"][number]) => i.quantity > 0));
  const requestOnly = itemsIn.some((item: any) => hasAmazonCancellationRequestOnly(item));
  const ambiguousCancel = plans.some((p) => p.ambiguousCancel);

  const reviewReasons: string[] = [];
  if (isFba) reviewReasons.push("Amazon-fulfilled (FBA) — not applied to seller inventory");
  if (isReplacement) reviewReasons.push("Replacement or exchange order — not auto-applied");
  if (isPreorder) reviewReasons.push("Pre-order (payment not authorized) — not auto-applied");
  if (emptyLive) reviewReasons.push("No line items on a non-cancelled order — not auto-applied");
  if (requestOnly) reviewReasons.push("Cancellation requested but not executed — quantity left in place");
  if (ambiguousCancel) {
    const reason = plans.find((p) => p.reason)?.reason;
    reviewReasons.push(reason || "Ambiguous Amazon cancellation — stock left unchanged pending review");
  }

  const occurredAt = parseIso(order?.createdTime);
  const updatedAt = parseIso(order?.lastUpdatedTime);

  return {
    platform: "amazon",
    externalOrderId: orderKey,
    orderKey,
    items,
    cancelled: allCancelled,
    autoApply: !allCancelled && !isFba && !isReplacement && !isPreorder && !emptyLive && !ambiguousCancel && items.some((i: any) => i.quantity > 0),
    needsReview: reviewReasons.length > 0,
    reviewReason: reviewReasons.join("; "),
    occurredAt,
    updatedAt,
    sourceKey: `api:amazon:${orderKey}`,
  };
}

function parseIso(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function nextAmazonCheckpoint(sales: SellerSale[], previous: string | null, fallback: Date): string {
  let max = previous ? Date.parse(previous) : NaN;
  for (const sale of sales) {
    const t = sale.updatedAt?.getTime() ?? sale.occurredAt?.getTime();
    if (t && (!Number.isFinite(max) || t > max)) max = t;
  }
  if (!Number.isFinite(max)) return fallback.toISOString();
  return new Date(max).toISOString();
}

export function amazonSearchUrl(params: {
  lastUpdatedAfter: string;
  paginationToken?: string;
}): string {
  const u = new URL(`${AMAZON_SP_ENDPOINT}${AMAZON_ORDERS_PATH}`);
  u.searchParams.set("marketplaceIds", AMAZON_INDIA_MARKETPLACE_ID);
  u.searchParams.set("lastUpdatedAfter", params.lastUpdatedAfter);
  u.searchParams.set("maxResultsPerPage", String(AMAZON_PAGE_SIZE));
  u.searchParams.set("includedData", "FULFILLMENT,CANCELLATION");
  if (params.paginationToken) u.searchParams.set("paginationToken", params.paginationToken);
  return u.toString();
}

export type AmazonPollResult = {
  sales: SellerSale[];
  pages: number;
  skipped: number;
  checkpoint: string;
  truncated: boolean;
  windowStart: string;
  windowEnd: string;
  resume: SellerApiResume | null;
};

export async function pollAmazonOrders(
  opts: {
    checkpoint?: string | null;
    now?: Date;
    fetchImpl?: FetchLike;
    tokenCache?: TokenCache;
    maxPages?: number;
    resume?: SellerApiResume | null;
  } = {}
): Promise<AmazonPollResult> {
  const creds = readAmazonCredentials();
  if (!creds) {
    throw new Error("Amazon seller API is not configured");
  }
  const now = opts.now || new Date();
  const resuming = !!(opts.resume?.windowStart && opts.resume?.amazonPaginationToken);
  const windowStart = resuming
    ? new Date(opts.resume!.windowStart)
    : sellerApiQueryStart({ checkpoint: opts.checkpoint, now });
  const lastUpdatedAfter = windowStart.toISOString();
  const windowEnd = resuming && opts.resume?.windowEnd ? opts.resume.windowEnd : now.toISOString();

  const reqOpts: RequestJsonOptions = { fetchImpl: opts.fetchImpl };
  const cache = opts.tokenCache || tokenCache;
  const maxPages = opts.maxPages ?? SELLER_API_MAX_PAGES;
  const sales: SellerSale[] = [];
  let skipped = 0;
  let pages = 0;
  let paginationToken: string | undefined = resuming ? String(opts.resume!.amazonPaginationToken).trim() || undefined : undefined;

  const authedGet = async (url: string) => {
    const token = await fetchAmazonAccessToken(creds, reqOpts, cache, now.getTime());
    try {
      return await requestJson<any>(
        url,
        {
          method: "GET",
          headers: {
            "x-amz-access-token": token,
            "user-agent": AMAZON_USER_AGENT,
            accept: "application/json",
          },
        },
        reqOpts
      );
    } catch (error) {
      if (error instanceof SellerApiHttpError && (error.status === 401 || error.status === 403)) {
        cache.accessToken = "";
        cache.expiresAt = 0;
        const retried = await fetchAmazonAccessToken(creds, reqOpts, cache, now.getTime() + 1);
        return requestJson<any>(
          url,
          {
            method: "GET",
            headers: {
              "x-amz-access-token": retried,
              "user-agent": AMAZON_USER_AGENT,
              accept: "application/json",
            },
          },
          reqOpts
        );
      }
      throw error;
    }
  };

  do {
    if (pages >= maxPages) break;
    const { data } = await authedGet(amazonSearchUrl({ lastUpdatedAfter, paginationToken }));
    pages += 1;
    const orders = Array.isArray(data?.orders) ? data.orders : [];
    for (const order of orders) {
      const sale = mapAmazonOrder(order);
      if (!sale) {
        skipped += 1;
        continue;
      }
      sales.push(sale);
    }
    const next = String(data?.pagination?.nextToken || "").trim();
    paginationToken = next || undefined;
  } while (paginationToken);

  const truncated = Boolean(paginationToken);
  const candidate = truncated
    ? String(opts.checkpoint || "")
    : nextAmazonCheckpoint(sales, opts.checkpoint || windowEnd, now);
  const resume: SellerApiResume | null = truncated
    ? {
        windowStart: lastUpdatedAfter,
        windowEnd,
        amazonPaginationToken: paginationToken,
      }
    : null;
  return {
    sales: dedupeSales(sales),
    pages,
    skipped,
    checkpoint: candidate,
    truncated,
    windowStart: lastUpdatedAfter,
    windowEnd,
    resume,
  };
}
