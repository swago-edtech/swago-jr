/**
 * Orchestrate Amazon + Flipkart seller API polls into the existing channel stock pipeline.
 * Unconfigured or disabled platforms are skipped (soft). Email sync is not modified here.
 * Checkpoints advance only after a complete, error-free ingest of the polled window.
 */

import connectDB from "../../connection";
import ChannelSellerApiState from "../../models/ChannelSellerApiState";
import ChannelStockOrder from "../../models/ChannelStockOrder";
import { pollAmazonOrders } from "./amazon";
import { nextStoredCheckpoint } from "./checkpoint";
import { isPlatformConfigured, missingEnvNames, sellerEnvStatus } from "./config";
import { pollFlipkartOrders } from "./flipkart";
import type { OutstandingShipment } from "./reconcile";
import { redactSecrets } from "./http";
import { ingestSellerApiSale } from "./ingest";
import { SELLER_API_STALE_MS, type PlatformSyncCounts, type PlatformSyncResult, type SellerApiResume, type SellerPlatform, type SellerSale } from "./types";

export type ChannelSellerApiSyncResult = {
  amazon: PlatformSyncResult;
  flipkart: PlatformSyncResult;
};

export function emptyCounts(): PlatformSyncCounts {
  return { fetched: 0, ingested: 0, cancelled: 0, reviewed: 0, skipped: 0, pages: 0 };
}

export function isSellerApiStale(lastSuccessAt: Date | string | null | undefined, now = Date.now(), staleMs = SELLER_API_STALE_MS): boolean {
  if (!lastSuccessAt) return true;
  const t = lastSuccessAt instanceof Date ? lastSuccessAt.getTime() : Date.parse(String(lastSuccessAt));
  if (Number.isNaN(t)) return true;
  return now - t > staleMs;
}

export function sanitizeSellerApiState(doc: any, configured: boolean) {
  const lastSuccessAt = doc?.lastSuccessAt || null;
  if (!doc) {
    return {
      platform: undefined,
      configured,
      enabled: true,
      lastSuccessAt: null,
      lastAttemptAt: null,
      lastError: "",
      lastCheckpoint: "",
      lastCounts: emptyCounts(),
      stale: configured,
      reviewCount: 0,
      outstandingCount: 0,
    };
  }
  return {
    platform: doc.platform,
    configured,
    enabled: doc.enabled !== false,
    lastSuccessAt,
    lastAttemptAt: doc.lastAttemptAt || null,
    lastError: doc.lastError || "",
    lastCheckpoint: doc.lastCheckpoint || "",
    lastCounts: {
      ...emptyCounts(),
      ...(doc.lastCounts || {}),
    },
    stale: configured && doc.enabled !== false ? isSellerApiStale(lastSuccessAt) : false,
    reviewCount: 0,
    outstandingCount: Array.isArray(doc.outstandingShipments) ? doc.outstandingShipments.length : 0,
  };
}

export async function getSellerApiStatus() {
  await connectDB();
  const env = sellerEnvStatus();
  const rows = await ChannelSellerApiState.find({ platform: { $in: ["amazon", "flipkart"] } }).lean();
  const byPlatform = new Map(rows.map((r: any) => [r.platform, r]));
  const reviewRows = await ChannelStockOrder.find({ needsReview: true })
    .select("channel sources")
    .lean();
  const reviewCount = { amazon: 0, flipkart: 0 };
  for (const row of reviewRows as any[]) {
    const ch = row.channel === "flipkart" ? "flipkart" : "amazon";
    const fromApi = (row.sources || []).some((s: any) => String(s.gmailMessageId || "").startsWith("api:"));
    if (fromApi) reviewCount[ch] += 1;
  }
  const amazon = sanitizeSellerApiState(byPlatform.get("amazon"), env.amazon);
  const flipkart = sanitizeSellerApiState(byPlatform.get("flipkart"), env.flipkart);
  amazon.reviewCount = reviewCount.amazon;
  flipkart.reviewCount = reviewCount.flipkart;
  return {
    amazon,
    flipkart,
    missing: {
      amazon: env.amazon ? [] : missingEnvNames("amazon"),
      flipkart: env.flipkart ? [] : missingEnvNames("flipkart"),
    },
  };
}

export async function setSellerApiEnabled(platform: SellerPlatform, enabled: boolean) {
  await connectDB();
  const state = await loadState(platform);
  state.enabled = enabled;
  await state.save();
  return getSellerApiStatus();
}

async function loadState(platform: SellerPlatform) {
  await connectDB();
  const existing = await ChannelSellerApiState.findOne({ platform });
  if (existing) return existing;
  try {
    return await ChannelSellerApiState.create({ platform, enabled: true });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
    const again = await ChannelSellerApiState.findOne({ platform });
    if (!again) throw error;
    return again;
  }
}



function readOutstanding(state: any): OutstandingShipment[] {
  return Array.isArray(state?.outstandingShipments) ? state.outstandingShipments : [];
}

function readResume(state: any): SellerApiResume | null {
  const r = state?.resume;
  if (!r || typeof r !== "object") return null;
  if (!r.windowStart || !r.windowEnd) return null;
  return {
    windowStart: String(r.windowStart),
    windowEnd: String(r.windowEnd),
    amazonPaginationToken: r.amazonPaginationToken ? String(r.amazonPaginationToken) : undefined,
    flipkartCursors: Array.isArray(r.flipkartCursors)
      ? r.flipkartCursors
          .filter((c: any) => c && c.id && c.nextUrl)
          .map((c: any) => ({ id: String(c.id), nextUrl: String(c.nextUrl) }))
      : undefined,
  };
}

function nextResume(opts: { truncated: boolean; ingestErrors: number; previous: SellerApiResume | null; candidate: SellerApiResume | null }): SellerApiResume | null {
  if (opts.ingestErrors > 0) return opts.previous;
  if (!opts.truncated) return null;
  return opts.candidate;
}

export type IngestAllResult = { ingestErrors: number };

export async function ingestAll(sales: SellerSale[], counts: PlatformSyncCounts): Promise<IngestAllResult> {
  counts.fetched += sales.length;
  let ingestErrors = 0;
  for (const sale of sales) {
    try {
      const result = await ingestSellerApiSale(sale);
      if (result.status === "ingested") counts.ingested += 1;
      else if (result.status === "cancelled") counts.cancelled += 1;
      else if (result.status === "reviewed") counts.reviewed += 1;
      else if (result.status === "error") {
        counts.skipped += 1;
        ingestErrors += 1;
      } else counts.skipped += 1;
    } catch (error) {
      counts.skipped += 1;
      ingestErrors += 1;
      console.error("Seller API ingest failed", sale.platform, sale.orderKey, redactSecrets(error));
    }
  }
  return { ingestErrors };
}

async function syncPlatform(platform: SellerPlatform): Promise<PlatformSyncResult> {
  if (!isPlatformConfigured(platform)) {
    return {
      platform,
      configured: false,
      skipped: true,
      reason: `Not configured (set ${missingEnvNames(platform).join(", ")})`,
    };
  }

  const state = await loadState(platform);
  if (state.enabled === false) {
    return {
      platform,
      configured: true,
      skipped: true,
      reason: "Disabled in admin — credentials and ingested data were left in place",
      lastSuccessAt: state.lastSuccessAt || null,
      checkpoint: state.lastCheckpoint || null,
    };
  }

  state.lastAttemptAt = new Date();
  const counts = emptyCounts();

  try {
    const previous = state.lastCheckpoint || "";
    const previousResume = readResume(state);
    let candidate = previous;
    let truncated = false;
    let pollResume: SellerApiResume | null = null;
    if (platform === "amazon") {
      const poll = await pollAmazonOrders({ checkpoint: previous || null, resume: previousResume });
      counts.pages = poll.pages;
      counts.skipped += poll.skipped;
      truncated = poll.truncated;
      candidate = poll.checkpoint;
      pollResume = poll.resume;
      const { ingestErrors } = await ingestAll(poll.sales, counts);
      state.lastCheckpoint = nextStoredCheckpoint({ previous, candidate, truncated, ingestErrors });
      state.resume = nextResume({ truncated, ingestErrors, previous: previousResume, candidate: pollResume });
      if (truncated || ingestErrors) {
        state.lastError = truncated
          ? ingestErrors
            ? `${ingestErrors} order(s) failed to ingest; checkpoint was not advanced`
            : "Page cap reached; remaining pages will be resumed on the next poll (checkpoint not advanced)"
          : `${ingestErrors} order(s) failed to ingest; checkpoint was not advanced`;
        state.lastCounts = counts;
        await state.save();
        return {
          platform,
          configured: true,
          error: state.lastError,
          counts,
          checkpoint: state.lastCheckpoint || null,
          lastSuccessAt: state.lastSuccessAt || null,
        };
      }
    } else {
      const previousOutstanding = readOutstanding(state);
      const poll = await pollFlipkartOrders({ checkpoint: previous || null, resume: previousResume, outstanding: previousOutstanding });
      counts.pages = poll.pages;
      counts.skipped += poll.skipped;
      truncated = poll.truncated;
      candidate = poll.checkpoint;
      pollResume = poll.resume;
      const { ingestErrors } = await ingestAll(poll.sales, counts);
      state.lastCheckpoint = nextStoredCheckpoint({ previous, candidate, truncated, ingestErrors });
      state.resume = nextResume({ truncated, ingestErrors, previous: previousResume, candidate: pollResume });
      if (ingestErrors <= 0) state.outstandingShipments = poll.outstanding || [];
      if (truncated || ingestErrors) {
        state.lastError = truncated
          ? ingestErrors
            ? `${ingestErrors} order(s) failed to ingest; checkpoint was not advanced`
            : "Page cap reached; remaining pages will be resumed on the next poll (checkpoint not advanced)"
          : `${ingestErrors} order(s) failed to ingest; checkpoint was not advanced`;
        state.lastCounts = counts;
        await state.save();
        return {
          platform,
          configured: true,
          error: state.lastError,
          counts,
          checkpoint: state.lastCheckpoint || null,
          lastSuccessAt: state.lastSuccessAt || null,
        };
      }
    }
    state.lastError = "";
    state.lastSuccessAt = new Date();
    state.lastCounts = counts;
    await state.save();
    return {
      platform,
      configured: true,
      counts,
      checkpoint: state.lastCheckpoint || null,
      lastSuccessAt: state.lastSuccessAt,
    };
  } catch (error) {
    const message = redactSecrets(error);
    state.lastError = message;
    state.lastCounts = counts;
    // Do not advance checkpoint on a thrown poll/ingest failure (it was not updated above).
    await state.save();
    return {
      platform,
      configured: true,
      error: message,
      counts,
      checkpoint: state.lastCheckpoint || null,
      lastSuccessAt: state.lastSuccessAt || null,
    };
  }
}

/**
 * Poll each configured seller API and ingest into the existing stock ledger.
 * Never throws for an unconfigured platform. Partial platform errors are returned, not thrown.
 */
export async function runChannelSellerApiSync(): Promise<ChannelSellerApiSyncResult> {
  await connectDB();
  const amazon = await syncPlatform("amazon");
  const flipkart = await syncPlatform("flipkart");
  return { amazon, flipkart };
}
