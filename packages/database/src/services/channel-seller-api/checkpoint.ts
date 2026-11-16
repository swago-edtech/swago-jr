/**
 * Pure checkpoint / window helpers. Incremental polls must not be clamped to the
 * bootstrap lookback (an outage longer than that window would otherwise skip orders).
 * A truncated page cap or ingest error must not advance the stored checkpoint.
 */

import { SELLER_API_BOOTSTRAP_LOOKBACK_MS, SELLER_API_OVERLAP_MS } from "./types";

export function sellerApiQueryStart(opts: {
  checkpoint?: string | null;
  now: Date;
  bootstrapMs?: number;
  overlapMs?: number;
}): Date {
  const bootstrapMs = opts.bootstrapMs ?? SELLER_API_BOOTSTRAP_LOOKBACK_MS;
  const overlapMs = opts.overlapMs ?? SELLER_API_OVERLAP_MS;
  const bootstrap = new Date(opts.now.getTime() - bootstrapMs);
  if (!opts.checkpoint) return bootstrap;
  const parsed = Date.parse(opts.checkpoint);
  if (Number.isNaN(parsed)) return bootstrap;
  return new Date(parsed - overlapMs);
}

export function shouldAdvanceCheckpoint(truncated: boolean, ingestErrors: number): boolean {
  return !truncated && ingestErrors <= 0;
}

export function nextStoredCheckpoint(opts: {
  previous: string | null | undefined;
  candidate: string;
  truncated: boolean;
  ingestErrors: number;
}): string {
  if (!shouldAdvanceCheckpoint(opts.truncated, opts.ingestErrors)) {
    return opts.previous || "";
  }
  return opts.candidate;
}

/** Trusted API sources (gmailMessageId api:*) are authoritative for current qty; email MAX is the fallback. */
export function isApiSourceKey(sourceKey: unknown): boolean {
  return String(sourceKey || "").startsWith("api:");
}
