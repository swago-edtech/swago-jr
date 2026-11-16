/**
 * Bounded HTTP helpers for seller APIs: timeout, 429/5xx backoff, Retry-After.
 * Network is injectable so tests never hit live endpoints.
 */

import { HTTP_MAX_RETRIES, HTTP_TIMEOUT_MS } from "./types";

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class SellerApiHttpError extends Error {
  status: number;
  retryable: boolean;
  bodySnippet: string;

  constructor(message: string, status: number, retryable: boolean, bodySnippet = "") {
    super(message);
    this.name = "SellerApiHttpError";
    this.status = status;
    this.retryable = retryable;
    this.bodySnippet = bodySnippet;
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

/** Parse Retry-After as seconds or HTTP date; returns wait ms, or null if absent/invalid. */
export function retryAfterMs(header: string | null, now = Date.now()): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Math.min(60_000, Math.max(0, Number(trimmed) * 1000));
  }
  const when = Date.parse(trimmed);
  if (Number.isNaN(when)) return null;
  return Math.min(60_000, Math.max(0, when - now));
}

export function backoffMs(attempt: number, retryAfter: number | null): number {
  if (retryAfter != null) return retryAfter;
  const base = Math.min(30_000, 1000 * 2 ** Math.max(0, attempt));
  return base;
}

function snippet(text: string, max = 240): string {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Strip likely secrets from an error string before persisting or returning to admin. */
export function redactSecrets(value: unknown): string {
  let s = value instanceof Error ? value.message : String(value || "");
  s = s.replace(/Bearer\s+[A-Za-z0-9._\-+=\/]+/gi, "Bearer [redacted]");
  s = s.replace(/Basic\s+[A-Za-z0-9._\-+=\/]+/gi, "Basic [redacted]");
  s = s.replace(/(refresh_token|access_token|client_secret|app_secret)=([^&\s]+)/gi, "$1=[redacted]");
  s = s.replace(/("?(refresh_token|access_token|client_secret|appSecret|app_secret)"?\s*:\s*")([^"]*)(")/gi, "$1[redacted]$4");
  return s;
}

export type RequestJsonOptions = {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function requestJson<T = unknown>(
  url: string,
  init: RequestInit,
  opts: RequestJsonOptions = {}
): Promise<{ data: T; status: number; headers: Headers }> {
  const fetchImpl = opts.fetchImpl || fetch;
  const timeoutMs = opts.timeoutMs ?? HTTP_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? HTTP_MAX_RETRIES;
  const sleep = opts.sleep || defaultSleep;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { ...init, signal: controller.signal });
      const text = await res.text();
      if (isRetryableStatus(res.status) && attempt < maxRetries) {
        const wait = backoffMs(attempt, retryAfterMs(res.headers.get("retry-after"), opts.now?.() ?? Date.now()));
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        throw new SellerApiHttpError(
          `HTTP ${res.status} from ${safeUrl(url)}: ${snippet(text)}`,
          res.status,
          isRetryableStatus(res.status),
          snippet(text)
        );
      }
      if (!text) return { data: {} as T, status: res.status, headers: res.headers };
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        throw new SellerApiHttpError(
          `Invalid JSON from ${safeUrl(url)}: ${snippet(text)}`,
          res.status,
          false,
          snippet(text)
        );
      }
      return { data, status: res.status, headers: res.headers };
    } catch (error) {
      if (error instanceof SellerApiHttpError) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      const aborted = lastError.name === "AbortError";
      if (attempt < maxRetries && (aborted || /network|fetch|ECONN|ETIMEDOUT/i.test(lastError.message))) {
        await sleep(backoffMs(attempt, null));
        continue;
      }
      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error("Request failed");
}

export function safeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("refresh_token");
    u.searchParams.delete("client_secret");
    u.searchParams.delete("access_token");
    u.searchParams.delete("token");
    return `${u.origin}${u.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}

export function formUrlEncoded(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}
