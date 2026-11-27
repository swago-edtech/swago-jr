/**
 * Channel email + seller-API sync worker for EC2 / VPS (PM2).
 *
 * Polls the web cron route on an interval. No CRON_SECRET required.
 *
 * Env (loads from monorepo root via __dirname, then cwd fallbacks):
 *   CHANNEL_EMAIL_SYNC_INTERVAL_MS  (default 300000 = 5 min)
 *   CHANNEL_EMAIL_SYNC_URL          (default http://127.0.0.1:$WEB_PORT/api/cron/channel-email-sync)
 *   WEB_PORT / PORT                 (default 3000; staging web uses 4000)
 */
const path = require("path");
const { config: loadEnv } = require("dotenv");

const REPO_ROOT = path.resolve(__dirname, "../..");

loadEnv({ path: path.join(REPO_ROOT, ".env.local") });
loadEnv({ path: path.join(REPO_ROOT, "apps/web/.env.local") });
loadEnv({ path: path.join(REPO_ROOT, ".env") });
loadEnv({ path: path.resolve(process.cwd(), "apps/web/.env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.CHANNEL_EMAIL_SYNC_INTERVAL_MS || 5 * 60 * 1000)
);

/** Staging web is often PORT=4000; allow WEB_PORT so the worker can match without a full URL. */
const WEB_PORT = String(process.env.WEB_PORT || process.env.PORT || "3000").trim() || "3000";
const SYNC_URL =
  process.env.CHANNEL_EMAIL_SYNC_URL ||
  `http://127.0.0.1:${WEB_PORT}/api/cron/channel-email-sync`;

async function syncViaHttp() {
  const res = await fetch(SYNC_URL, { headers: { Accept: "application/json" } });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)} (url=${SYNC_URL})`);
  }
  return body;
}

let inFlight = false;
let lastReconnectWarnAt = 0;
const RECONNECT_WARN_EVERY_MS = 30 * 60 * 1000;

async function tick() {
  if (inFlight) {
    console.log("[channel-email-worker] previous sync still running — skip");
    return;
  }
  inFlight = true;
  const started = Date.now();
  try {
    const result = await syncViaHttp();
    const email = result && result.email ? result.email : result;
    const sellerApi = result && result.sellerApi ? result.sellerApi : null;
    if (email && email.needsReconnect) {
      const now = Date.now();
      if (now - lastReconnectWarnAt >= RECONNECT_WARN_EVERY_MS) {
        lastReconnectWarnAt = now;
        console.warn(
          `[channel-email-worker] Gmail needs reconnect once (not a deploy wipe):`,
          email.message || "Connect Gmail in Admin → Channel Sync"
        );
      }
    } else {
      lastReconnectWarnAt = 0;
      const sellerSummary = sellerApi
        ? ` amazon=${sellerApi.amazon?.error ? "error" : sellerApi.amazon?.skipped ? "skipped" : "ok"} flipkart=${sellerApi.flipkart?.error ? "error" : sellerApi.flipkart?.skipped ? "skipped" : "ok"}`
        : result?.sellerApiError
          ? ` sellerApiError=${result.sellerApiError}`
          : "";
      console.log(
        `[channel-email-worker] sync ok in ${Date.now() - started}ms`,
        `processed=${email?.processed ?? "?"} skipped=${email?.skipped ?? "?"}`,
        email?.message || "",
        sellerSummary
      );
    }
  } catch (error) {
    const msg = error && error.message ? error.message : String(error);
    console.error(`[channel-email-worker] sync failed in ${Date.now() - started}ms`, msg);
    if (msg.includes("HTTP 401")) {
      console.error(
        "[channel-email-worker] 401 tip: either staging-web is still on an OLD build (rebuild after pull), " +
          "or this worker is hitting the wrong port. staging-web listens on :4000 — set in .env.local:\n" +
          "  CHANNEL_EMAIL_SYNC_URL=http://127.0.0.1:4000/api/cron/channel-email-sync\n" +
          "  (or WEB_PORT=4000)\n" +
          `  current url=${SYNC_URL}`
      );
    }
  } finally {
    inFlight = false;
  }
}

console.log(
  `[channel-email-worker] started — every ${INTERVAL_MS}ms → ${SYNC_URL}`
);

setTimeout(() => {
  tick();
  setInterval(tick, INTERVAL_MS);
}, Number(process.env.CHANNEL_EMAIL_SYNC_BOOT_DELAY_MS || 15_000));
