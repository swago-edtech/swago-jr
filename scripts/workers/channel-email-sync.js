/**
 * Channel email sync worker for EC2 / VPS.
 *
 * Started automatically with deploy (PM2) alongside web + admin.
 * Also runs under `pnpm start` locally/production if you use the monorepo start script.
 *
 * Polls the web cron route on an interval. No external cron service required.
 *
 * Env (loads apps/web/.env.local, apps/admin/.env.local, then root .env):
 *   CHANNEL_EMAIL_SYNC_INTERVAL_MS  (default 300000 = 5 min)
 *   CHANNEL_EMAIL_SYNC_URL          (default http://127.0.0.1:3000/api/cron/channel-email-sync)
 *   CRON_SECRET                     (required when web NODE_ENV=production)
 */
const path = require("path");
const { config: loadEnv } = require("dotenv");

loadEnv({ path: path.resolve(process.cwd(), "apps/web/.env.local") });
loadEnv({ path: path.resolve(process.cwd(), "apps/admin/.env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const INTERVAL_MS = Math.max(
  60_000,
  Number(process.env.CHANNEL_EMAIL_SYNC_INTERVAL_MS || 5 * 60 * 1000)
);
const SYNC_URL =
  process.env.CHANNEL_EMAIL_SYNC_URL ||
  "http://127.0.0.1:3000/api/cron/channel-email-sync";

async function syncViaHttp() {
  const headers = { Accept: "application/json" };
  if (process.env.CRON_SECRET) {
    headers.Authorization = `Bearer ${process.env.CRON_SECRET}`;
  }
  const res = await fetch(SYNC_URL, { headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

let inFlight = false;

async function tick() {
  if (inFlight) {
    console.log("[channel-email-worker] previous sync still running — skip");
    return;
  }
  inFlight = true;
  const started = Date.now();
  console.log(`[channel-email-worker] sync start ${new Date().toISOString()}`);
  try {
    const result = await syncViaHttp();
    console.log(
      `[channel-email-worker] sync ok in ${Date.now() - started}ms`,
      result
    );
  } catch (error) {
    console.error(
      `[channel-email-worker] sync failed in ${Date.now() - started}ms`,
      error && error.message ? error.message : error
    );
  } finally {
    inFlight = false;
  }
}

console.log(
  `[channel-email-worker] started — every ${INTERVAL_MS}ms → ${SYNC_URL}`
);

// Give the web app a moment when all processes boot together (pm2 / pnpm start)
setTimeout(() => {
  tick();
  setInterval(tick, INTERVAL_MS);
}, Number(process.env.CHANNEL_EMAIL_SYNC_BOOT_DELAY_MS || 15_000));
