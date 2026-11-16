/**
 * Shared shapes for read-only marketplace seller API ingestion.
 * No buyer/shipping PII is requested or stored from these APIs.
 */

export type SellerPlatform = "amazon" | "flipkart";

export type SellerLine = {
  sku: string;
  title: string;
  quantity: number;
  orderItemId?: string;
  cancelled?: boolean;
  isReplacement?: boolean;
  status?: string;
};

export type SellerSale = {
  platform: SellerPlatform;
  /** Stable marketplace order id (Amazon 3-7-7, Flipkart orderId). */
  externalOrderId: string;
  /** ChannelStockOrder._id — Amazon uses the same key as email sync. */
  orderKey: string;
  items: SellerLine[];
  /** Whole-order cancellation (restore via existing cancelled flag). */
  cancelled: boolean;
  /** Do not auto-cut: FBA, replacement, pre-order, unmatched, returns-only, etc. */
  autoApply: boolean;
  needsReview: boolean;
  reviewReason: string;
  occurredAt?: Date;
  updatedAt?: Date;
  sourceKey: string;
};

export type PlatformSyncCounts = {
  fetched: number;
  ingested: number;
  cancelled: number;
  reviewed: number;
  skipped: number;
  pages: number;
};

/** Opaque, server-only pagination resume. Never sent to the admin client. */
export type SellerApiResume = {
  windowStart: string;
  windowEnd: string;
  amazonPaginationToken?: string;
  flipkartCursors?: Array<{ id: string; nextUrl: string }>;
};

export type PlatformSyncResult = {
  platform: SellerPlatform;
  configured: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  counts?: PlatformSyncCounts;
  checkpoint?: string | null;
  lastSuccessAt?: Date | null;
};

export const AMAZON_SP_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com";
export const AMAZON_LWA_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
export const AMAZON_INDIA_MARKETPLACE_ID = "A21TJRUUN4KGV";
export const AMAZON_ORDERS_PATH = "/orders/2026-01-01/orders";
export const AMAZON_USER_AGENT = "SwagoJr/1.0 (Language=TypeScript)";

export const FLIPKART_API_ORIGIN = "https://api.flipkart.net";
export const FLIPKART_TOKEN_PATH = "/oauth-service/oauth/token";
export const FLIPKART_SHIPMENTS_FILTER_PATH = "/sellers/v3/shipments/filter/";
export const FLIPKART_SHIPMENTS_LOOKUP_PATH = "/sellers/v3/shipments";
export const FLIPKART_RETURNS_PATH = "/sellers/v2/returns";
export const FLIPKART_SCOPE = "Seller_Api";

/** Fixed tunables — not environment variables. */
/** First run only (no checkpoint). Incremental polls use the checkpoint minus overlap, unclamped. */
export const SELLER_API_BOOTSTRAP_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
/** @deprecated alias of bootstrap lookback; do not use to clamp incremental checkpoints. */
export const SELLER_API_LOOKBACK_MS = SELLER_API_BOOTSTRAP_LOOKBACK_MS;
export const SELLER_API_OVERLAP_MS = 2 * 60 * 60 * 1000;
export const SELLER_API_MAX_PAGES = 12;
/** Max open Flipkart shipments kept for status reconciliation across polls. */
export const FLIPKART_OUTSTANDING_CAP = 250;
export const FLIPKART_RECONCILE_BATCH = 25;
export const FLIPKART_RECONCILE_MAX_REQUESTS = 2;
export const SELLER_API_STALE_MS = 30 * 60 * 1000;
export const AMAZON_PAGE_SIZE = 100;
export const FLIPKART_PAGE_SIZE = 20;
export const HTTP_MAX_RETRIES = 4;
export const HTTP_TIMEOUT_MS = 25_000;
export const TOKEN_EXPIRY_SKEW_MS = 60_000;
