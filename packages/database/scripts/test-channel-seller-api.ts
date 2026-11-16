/**
 * Seller API adapters and ingestion helpers (no live network, no real DB).
 * Run (dummy URI only so mongoose config can load; this file never connects):
 *   MONGODB_URI=mongodb://127.0.0.1:27017/swago-seller-api-unit-test npx tsx packages/database/scripts/test-channel-seller-api.ts
 */
import assert from "node:assert/strict";
import { mergeOrderDesired, planLedgerDeltas, apiSourceEventId, planDesiredFromSources } from "../src/services/channel-ledger";
import {
  missingEnvNames,
  readAmazonCredentials,
  readFlipkartCredentials,
  sellerEnvStatus,
} from "../src/services/channel-seller-api/config";
import {
  amazonItemQuantity,
  amazonOrderKey,
  amazonSearchUrl,
  fetchAmazonAccessToken,
  hasAmazonCancellationRequestOnly,
  isAmazonItemCancelled,
  isAmazonReplacementOrder,
  mapAmazonOrder,
  planAmazonItemStock,
  nextAmazonCheckpoint,
  pollAmazonOrders,
  resetAmazonTokenCache,
} from "../src/services/channel-seller-api/amazon";
import {
  applyFlipkartReturnFlag,
  finalizeFlipkartSales,
  flipkartDateWindow,
  flipkartExternalId,
  flipkartOrderKey,
  mapFlipkartOrderItem,
  mergeFlipkartShipments,
  pollFlipkartOrders,
  reviewOnlyFlipkartReturnSale,
  resetFlipkartTokenCache,
  resolveFlipkartNextUrl,
} from "../src/services/channel-seller-api/flipkart";
import {
  backoffMs,
  isRetryableStatus,
  redactSecrets,
  requestJson,
  retryAfterMs,
  SellerApiHttpError,
} from "../src/services/channel-seller-api/http";
import { linesForStock, planIngestActions, isStockSyncFailure, ingestSellerApiSale } from "../src/services/channel-seller-api/ingest";
import { sellerApiQueryStart, shouldAdvanceCheckpoint, nextStoredCheckpoint } from "../src/services/channel-seller-api/checkpoint";
import {
  collectOutstandingFromShipments,
  flipkartShipmentsLookupUrl,
  mergeOutstanding,
  refreshOutstandingAfterLookup,
  selectOutstandingBatch,
} from "../src/services/channel-seller-api/reconcile";

import { isSellerApiStale } from "../src/services/channel-seller-api/sync";
import { dedupeSales } from "../src/services/channel-seller-api/shared";
import { AMAZON_INDIA_MARKETPLACE_ID, AMAZON_SP_ENDPOINT, SELLER_API_BOOTSTRAP_LOOKBACK_MS } from "../src/services/channel-seller-api/types";
import { normalizeChannelOrderId } from "../src/services/channel-email-parse";

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok  ${name}`);
    })
    .catch((error) => {
      console.error(`FAIL  ${name}`);
      throw error;
    });
}

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  });
}

async function main() {
  await test("missing Amazon env lists exact names and stays unconfigured", () => {
    const prev = {
      AMAZON_SP_CLIENT_ID: process.env.AMAZON_SP_CLIENT_ID,
      AMAZON_SP_CLIENT_SECRET: process.env.AMAZON_SP_CLIENT_SECRET,
      AMAZON_SP_REFRESH_TOKEN: process.env.AMAZON_SP_REFRESH_TOKEN,
    };
    delete process.env.AMAZON_SP_CLIENT_ID;
    delete process.env.AMAZON_SP_CLIENT_SECRET;
    delete process.env.AMAZON_SP_REFRESH_TOKEN;
    assert.equal(readAmazonCredentials(), null);
    assert.deepEqual(missingEnvNames("amazon"), [
      "AMAZON_SP_CLIENT_ID",
      "AMAZON_SP_CLIENT_SECRET",
      "AMAZON_SP_REFRESH_TOKEN",
    ]);
    assert.equal(sellerEnvStatus().amazon, false);
    process.env.AMAZON_SP_CLIENT_ID = prev.AMAZON_SP_CLIENT_ID;
    process.env.AMAZON_SP_CLIENT_SECRET = prev.AMAZON_SP_CLIENT_SECRET;
    process.env.AMAZON_SP_REFRESH_TOKEN = prev.AMAZON_SP_REFRESH_TOKEN;
    for (const [k, v] of Object.entries(prev)) {
      if (v == null) delete process.env[k];
      else process.env[k] = v;
    }
  });

  await test("missing Flipkart env lists exact names", () => {
    const prevId = process.env.FLIPKART_APP_ID;
    const prevSecret = process.env.FLIPKART_APP_SECRET;
    delete process.env.FLIPKART_APP_ID;
    delete process.env.FLIPKART_APP_SECRET;
    assert.equal(readFlipkartCredentials(), null);
    assert.deepEqual(missingEnvNames("flipkart"), ["FLIPKART_APP_ID", "FLIPKART_APP_SECRET"]);
    if (prevId == null) delete process.env.FLIPKART_APP_ID;
    else process.env.FLIPKART_APP_ID = prevId;
    if (prevSecret == null) delete process.env.FLIPKART_APP_SECRET;
    else process.env.FLIPKART_APP_SECRET = prevSecret;
  });

  await test("Amazon order key matches email-sync normalisation", () => {
    const raw = "408-1234567-1234567";
    assert.equal(amazonOrderKey(raw), normalizeChannelOrderId(raw));
    assert.equal(amazonOrderKey("408 1234567 1234567"), "408-1234567-1234567");
  });

  await test("Flipkart order keys are prefixed and stable", () => {
    assert.equal(flipkartOrderKey("OD123456789"), "FK-OD123456789");
    assert.equal(flipkartOrderKey("fk-od123456789"), "FK-OD123456789");
    assert.equal(flipkartExternalId("FK-OD123456789"), "OD123456789");
    assert.notEqual(flipkartOrderKey("408-1234567-1234567"), amazonOrderKey("408-1234567-1234567"));
  });

  await test("mapAmazonOrder cuts merchant unshipped orders and skips FBA / replacement / preorder / cancel", () => {
    const confirmed = mapAmazonOrder({
      orderId: "408-1234567-1234567",
      createdTime: "2026-11-01T00:00:00Z",
      lastUpdatedTime: "2026-11-01T01:00:00Z",
      fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
      orderItems: [
        { orderItemId: "1", quantityOrdered: 2, product: { sellerSku: "SWG-1", title: "Seek" } },
      ],
    });
    assert.equal(confirmed?.autoApply, true);
    assert.equal(confirmed?.cancelled, false);
    assert.equal(confirmed?.items[0].quantity, 2);
    assert.equal(confirmed?.orderKey, "408-1234567-1234567");

    const cancelled = mapAmazonOrder({
      orderId: "408-1234567-1234567",
      fulfillment: { fulfillmentStatus: "CANCELLED", fulfilledBy: "MERCHANT" },
      orderItems: [{ orderItemId: "1", quantityOrdered: 2, product: { sellerSku: "SWG-1", title: "Seek" } }],
    });
    assert.equal(cancelled?.cancelled, true);
    assert.equal(cancelled?.autoApply, false);

    const itemCancel = mapAmazonOrder({
      orderId: "408-7654321-7654321",
      fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
      orderItems: [
        {
          orderItemId: "1",
          quantityOrdered: 1,
          product: { sellerSku: "SWG-1", title: "Seek" },
          cancellation: { cancellationExecution: { cancelledBy: "BUYER" } },
        },
      ],
    });
    assert.equal(isAmazonItemCancelled({ quantityOrdered: 1, cancellation: { cancellationExecution: {} } }), false);
    assert.equal(amazonItemQuantity({ quantityOrdered: 3, cancellation: { cancellationExecution: {} } }), 3);
    assert.equal(itemCancel?.cancelled, false);
    assert.equal(itemCancel?.autoApply, false);
    assert.equal(itemCancel?.needsReview, true);
    assert.equal(itemCancel?.items[0].quantity, 1);
    assert.match(itemCancel?.reviewReason || "", /pending review/);

    const fba = mapAmazonOrder({
      orderId: "408-1111111-1111111",
      fulfillment: { fulfillmentStatus: "SHIPPED", fulfilledBy: "AMAZON" },
      orderItems: [{ orderItemId: "1", quantityOrdered: 1, product: { sellerSku: "SWG-1", title: "Seek" } }],
    });
    assert.equal(fba?.autoApply, false);
    assert.match(fba?.reviewReason || "", /FBA/);

    const replacement = mapAmazonOrder({
      orderId: "408-2222222-2222222",
      associatedOrders: [{ orderId: "408-0000000-0000000", associationType: "REPLACEMENT_ORIGINAL_ID" }],
      fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
      orderItems: [{ orderItemId: "1", quantityOrdered: 1, product: { sellerSku: "SWG-1", title: "Seek" } }],
    });
    assert.equal(isAmazonReplacementOrder({ associatedOrders: [{ associationType: "REPLACEMENT_ORIGINAL_ID" }] }), true);
    assert.equal(replacement?.autoApply, false);

    const preorder = mapAmazonOrder({
      orderId: "408-3333333-3333333",
      fulfillment: { fulfillmentStatus: "PENDING_AVAILABILITY", fulfilledBy: "MERCHANT" },
      orderItems: [{ orderItemId: "1", quantityOrdered: 1, product: { sellerSku: "SWG-1", title: "Seek" } }],
    });
    assert.equal(preorder?.autoApply, false);
    assert.equal(mapAmazonOrder({}), null);
  });

  await test("Amazon search URL is India EU orders v2026-01-01 without PII datasets", () => {
    const url = amazonSearchUrl({ lastUpdatedAfter: "2026-11-01T00:00:00.000Z", paginationToken: "abc" });
    assert.ok(url.startsWith(`${AMAZON_SP_ENDPOINT}/orders/2026-01-01/orders`));
    assert.ok(url.includes(`marketplaceIds=${AMAZON_INDIA_MARKETPLACE_ID}`));
    assert.ok(url.includes("includedData=FULFILLMENT%2CCANCELLATION") || url.includes("includedData=FULFILLMENT,CANCELLATION"));
    assert.ok(!url.includes("BUYER"));
    assert.ok(!url.includes("RECIPIENT"));
    assert.ok(url.includes("paginationToken=abc"));
  });

  await test("Amazon poll follows paginationToken and uses lastUpdatedAfter checkpoint overlap later", async () => {
    process.env.AMAZON_SP_CLIENT_ID = "test-client";
    process.env.AMAZON_SP_CLIENT_SECRET = "test-secret";
    process.env.AMAZON_SP_REFRESH_TOKEN = "test-refresh";
    resetAmazonTokenCache();
    const calls: string[] = [];
    const fetchImpl = async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(`${init?.method || "GET"} ${url}`);
      if (url.includes("api.amazon.com/auth/o2/token")) {
        return jsonResponse({ access_token: "access-1", expires_in: 3600 });
      }
      if (url.includes("paginationToken=page-2")) {
        return jsonResponse({
          orders: [
            {
              orderId: "408-0000002-0000002",
              createdTime: "2026-11-02T00:00:00Z",
              lastUpdatedTime: "2026-11-02T12:00:00Z",
              fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
              orderItems: [{ orderItemId: "2", quantityOrdered: 1, product: { sellerSku: "B", title: "B" } }],
            },
          ],
        });
      }
      return jsonResponse({
        orders: [
          {
            orderId: "408-0000001-0000001",
            createdTime: "2026-11-01T00:00:00Z",
            lastUpdatedTime: "2026-11-01T12:00:00Z",
            fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
            orderItems: [{ orderItemId: "1", quantityOrdered: 1, product: { sellerSku: "A", title: "A" } }],
          },
        ],
        pagination: { nextToken: "page-2" },
      });
    };
    const result = await pollAmazonOrders({
      checkpoint: "2026-11-01T00:00:00.000Z",
      now: new Date("2026-11-10T00:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "", expiresAt: 0 },
    });
    assert.equal(result.pages, 2);
    assert.equal(result.sales.length, 2);
    assert.ok(calls.some((c) => c.includes("auth/o2/token")));
    assert.ok(calls.some((c) => c.includes("paginationToken=page-2")));
    assert.equal(result.checkpoint, "2026-11-02T12:00:00.000Z");
    delete process.env.AMAZON_SP_CLIENT_ID;
    delete process.env.AMAZON_SP_CLIENT_SECRET;
    delete process.env.AMAZON_SP_REFRESH_TOKEN;
  });

  await test("Amazon access token is cached until near expiry", async () => {
    resetAmazonTokenCache();
    let tokenCalls = 0;
    const fetchImpl = async (input: string | URL) => {
      if (String(input).includes("/auth/o2/token")) {
        tokenCalls += 1;
        return jsonResponse({ access_token: "cached-token", expires_in: 3600 });
      }
      throw new Error(`unexpected ${input}`);
    };
    const cache = { accessToken: "", expiresAt: 0 };
    const creds = { clientId: "id", clientSecret: "secret", refreshToken: "refresh" };
    const a = await fetchAmazonAccessToken(creds, { fetchImpl }, cache, 1_000_000);
    const b = await fetchAmazonAccessToken(creds, { fetchImpl }, cache, 1_000_000 + 10_000);
    assert.equal(a, "cached-token");
    assert.equal(b, "cached-token");
    assert.equal(tokenCalls, 1);
  });

  await test("HTTP backoff, Retry-After, redaction, and 429 retry then success", async () => {
    assert.equal(isRetryableStatus(429), true);
    assert.equal(isRetryableStatus(404), false);
    assert.equal(retryAfterMs("2"), 2000);
    assert.ok((backoffMs(0, null) as number) >= 1000);
    const redacted = redactSecrets('Authorization Bearer abc.def and "refresh_token":"secret-value"');
    assert.ok(!redacted.includes("secret-value"));
    assert.ok(!redacted.includes("abc.def"));

    let attempts = 0;
    const sleeps: number[] = [];
    const fetchImpl = async () => {
      attempts += 1;
      if (attempts === 1) return jsonResponse({ error: "slow down" }, { status: 429, headers: { "retry-after": "1" } });
      return jsonResponse({ ok: true });
    };
    const { data } = await requestJson<{ ok: boolean }>(
      "https://example.invalid/test",
      { method: "GET" },
      { fetchImpl, sleep: async (ms) => { sleeps.push(ms); }, maxRetries: 2 }
    );
    assert.equal(data.ok, true);
    assert.equal(attempts, 2);
    assert.deepEqual(sleeps, [1000]);
    await assert.rejects(
      () => requestJson("https://example.invalid/fail", { method: "GET" }, {
        fetchImpl: async () => jsonResponse({ error: "no" }, { status: 400 }),
        maxRetries: 0,
      }),
      (err: unknown) => err instanceof SellerApiHttpError && err.status === 400
    );
  });

  await test("Flipkart next URL allowlist and https upgrade", () => {
    const ok = resolveFlipkartNextUrl("/v3/shipments/filter?next_token=abc");
    assert.ok(ok?.startsWith("https://api.flipkart.net/"));
    assert.equal(resolveFlipkartNextUrl("https://evil.example/steal"), null);
    assert.ok(resolveFlipkartNextUrl("http://api.flipkart.net/sellers/v3/shipments/filter?next_token=1")?.startsWith("https://"));
    assert.equal(resolveFlipkartNextUrl(""), null);
  });

  await test("Flipkart shipment merge: cancel overwrites, replacements and returns are review-only", () => {
    const into = new Map();
    mergeFlipkartShipments(
      [
        {
          updatedAt: "2026-11-01T00:00:00Z",
          orderItems: [
            { orderId: "OD1", orderItemId: "I1", sku: "SWG-1", quantity: 2, status: "APPROVED", orderDate: "2026-11-01T00:00:00Z" },
          ],
        },
        {
          updatedAt: "2026-11-02T00:00:00Z",
          orderItems: [
            { orderId: "OD1", orderItemId: "I1", sku: "SWG-1", quantity: 2, status: "CANCELLED", cancellationDate: "2026-11-02T00:00:00Z" },
          ],
        },
        {
          orderItems: [
            { orderId: "OD2", orderItemId: "I2", sku: "SWG-2", quantity: 1, status: "APPROVED", isReplacement: true },
          ],
        },
        {
          orderItems: [
            { orderId: "OD3", orderItemId: "I3", sku: "SWG-3", quantity: 1, status: "RETURNED" },
          ],
        },
      ],
      into
    );
    const sales = finalizeFlipkartSales(into);
    const od1 = sales.find((s) => s.externalOrderId === "OD1");
    const od2 = sales.find((s) => s.externalOrderId === "OD2");
    const od3 = sales.find((s) => s.externalOrderId === "OD3");
    assert.equal(od1?.cancelled, true);
    assert.equal(od1?.items[0].quantity, 0);
    assert.equal(od2?.autoApply, false);
    assert.match(od2?.reviewReason || "", /replacement/i);
    assert.equal(od3?.autoApply, false);
    assert.match(od3?.reviewReason || "", /Return/i);
    assert.equal(mapFlipkartOrderItem({}), null);
  });

  await test("Flipkart poll POSTs first page and GETs nextPageUrl; unconfigured poll throws", async () => {
    process.env.FLIPKART_APP_ID = "app";
    process.env.FLIPKART_APP_SECRET = "secret";
    resetFlipkartTokenCache();
    const methods: string[] = [];
    const fetchImpl = async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      methods.push(`${init?.method || "GET"} ${url}`);
      if (url.includes("/oauth-service/oauth/token")) {
        return jsonResponse({ access_token: "fk-token", expires_in: 3600 });
      }
      if ((init?.method || "GET") === "POST") {
        return jsonResponse({
          hasMore: true,
          nextPageUrl: "/sellers/v3/shipments/filter/?next_token=n1",
          shipments: [
            { orderItems: [{ orderId: "OD9", orderItemId: "A", sku: "S1", quantity: 1, status: "APPROVED" }] },
          ],
        });
      }
      if (url.includes("v2/returns")) {
        return jsonResponse({ hasMore: false, returnItems: [] });
      }
      return jsonResponse({ hasMore: false, shipments: [] });
    };
    const result = await pollFlipkartOrders({
      now: new Date("2026-11-10T00:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "", expiresAt: 0 },
      maxPages: 3,
    });
    assert.ok(result.pages >= 2);
    assert.ok(methods.some((m) => m.startsWith("POST ") && m.includes("/v3/shipments/filter")));
    assert.ok(methods.some((m) => m.startsWith("GET ") && m.includes("next_token=n1")));
    assert.ok(result.sales.some((s) => s.externalOrderId === "OD9"));
    delete process.env.FLIPKART_APP_ID;
    delete process.env.FLIPKART_APP_SECRET;
    await assert.rejects(() => pollFlipkartOrders({ fetchImpl: async () => jsonResponse({}) }));
  });

  await test("email + API desired quantities MAX-merge so repeats do not double-cut", () => {
    const email = [{ productId: "p1", productName: "Seek", quantity: 2 }];
    const api = [{ productId: "p1", productName: "Seek", quantity: 2 }];
    const desired = mergeOrderDesired([email, api]);
    assert.equal(desired.get("p1")?.quantity, 2);
    const deltas = planLedgerDeltas(desired, new Map([["p1", { quantity: 2 }]]));
    assert.equal(deltas.length, 0);
    const cancelledDesired: typeof desired = new Map();
    const restore = planLedgerDeltas(cancelledDesired, new Map([["p1", { quantity: 2, productName: "Seek" }]]));
    assert.equal(restore[0]?.delta, -2);
  });

  await test("linesForStock and stable API source ids", () => {
    assert.deepEqual(
      linesForStock(
        {
          platform: "amazon",
          externalOrderId: "x",
          orderKey: "x",
          items: [],
          cancelled: true,
          autoApply: false,
          needsReview: false,
          reviewReason: "",
          sourceKey: "api:amazon:x",
        },
        [{ productId: "p1", productName: "Seek", quantity: 2 }]
      ),
      []
    );
    const a = apiSourceEventId("api:amazon:408-1234567-1234567").toString();
    const b = apiSourceEventId("api:amazon:408-1234567-1234567").toString();
    const c = apiSourceEventId("api:flipkart:FK-OD1").toString();
    assert.equal(a, b);
    assert.notEqual(a, c);
  });

  await test("dedupe keeps the later sale; Flipkart window applies overlap and lookback", () => {
    const sales = dedupeSales([
      { platform: "amazon", externalOrderId: "1", orderKey: "K", items: [], cancelled: false, autoApply: true, needsReview: false, reviewReason: "first", sourceKey: "a" },
      { platform: "amazon", externalOrderId: "1", orderKey: "K", items: [], cancelled: true, autoApply: false, needsReview: false, reviewReason: "later", sourceKey: "a" },
    ]);
    assert.equal(sales.length, 1);
    assert.equal(sales[0].cancelled, true);
    const { from, to } = flipkartDateWindow("2026-11-10T10:00:00.000Z", new Date("2026-11-10T12:00:00.000Z"));
    assert.equal(to, "2026-11-10T12:00:00.000Z");
    assert.ok(Date.parse(from) < Date.parse("2026-11-10T10:00:00.000Z"));
    assert.equal(nextAmazonCheckpoint([], null, new Date("2026-11-10T00:00:00.000Z")), "2026-11-10T00:00:00.000Z");
  });


  await test("incremental query start is not clamped to bootstrap lookback", () => {
    const now = new Date("2026-11-10T00:00:00.000Z");
    const bootstrap = sellerApiQueryStart({ checkpoint: null, now });
    assert.equal(now.getTime() - bootstrap.getTime(), SELLER_API_BOOTSTRAP_LOOKBACK_MS);
    const outage = sellerApiQueryStart({ checkpoint: "2026-08-01T00:00:00.000Z", now });
    assert.ok(outage.getTime() < now.getTime() - SELLER_API_BOOTSTRAP_LOOKBACK_MS, "must not clamp a 3-month-old checkpoint up to 30 days");
    assert.ok(outage.getTime() < Date.parse("2026-08-01T00:00:00.000Z"));
  });

  await test("checkpoint does not advance when truncated or ingest errors", () => {
    assert.equal(shouldAdvanceCheckpoint(true, 0), false);
    assert.equal(shouldAdvanceCheckpoint(false, 1), false);
    assert.equal(shouldAdvanceCheckpoint(false, 0), true);
    assert.equal(nextStoredCheckpoint({ previous: "prev", candidate: "next", truncated: true, ingestErrors: 0 }), "prev");
    assert.equal(nextStoredCheckpoint({ previous: "prev", candidate: "next", truncated: false, ingestErrors: 2 }), "prev");
    assert.equal(nextStoredCheckpoint({ previous: "prev", candidate: "next", truncated: false, ingestErrors: 0 }), "next");
    assert.equal(nextStoredCheckpoint({ previous: "", candidate: "next", truncated: true, ingestErrors: 0 }), "");
  });

  await test("trusted API source is authoritative so a later partial cancel can reduce qty", () => {
    const email = [{ trusted: true, gmailMessageId: "gmail-1", lines: [{ productId: "p1", productName: "Seek", quantity: 2 }, { productId: "p2", productName: "Word", quantity: 1 }] }];
    const apiPartial = [{ trusted: true, gmailMessageId: "api:amazon:408-1", lines: [{ productId: "p1", productName: "Seek", quantity: 1 }] }];
    const mixed = [...email, ...apiPartial];
    // Old MAX policy would keep p1=2 and p2=1. API authority must yield p1=1 and drop p2.
    const maxed = mergeOrderDesired(mixed.map((s) => s.lines));
    assert.equal(maxed.get("p1")?.quantity, 2);
    const desired = planDesiredFromSources(mixed, [], false);
    assert.equal(desired.get("p1")?.quantity, 1);
    assert.equal(desired.has("p2"), false);
    const deltas = planLedgerDeltas(desired, new Map([["p1", { quantity: 2, productName: "Seek" }], ["p2", { quantity: 1, productName: "Word" }]]));
    assert.ok(deltas.some((d) => d.productId === "p1" && d.delta === -1));
    assert.ok(deltas.some((d) => d.productId === "p2" && d.delta === -1));
    assert.equal(planDesiredFromSources(email, [], true).size, 0);
    // Untrusted API must not override email
    const untrustedApi = [...email, { trusted: false, gmailMessageId: "api:amazon:408-1", lines: [{ productId: "p1", productName: "Seek", quantity: 1 }] }];
    assert.equal(planDesiredFromSources(untrustedApi, [], false).get("p1")?.quantity, 2);
  });

  await test("Amazon cancellation request without execution does not zero quantity", () => {
    assert.equal(isAmazonItemCancelled({ cancellation: { cancellationRequest: { requester: "BUYER" } } }), false);
    assert.equal(hasAmazonCancellationRequestOnly({ cancellation: { cancellationRequest: { requester: "BUYER" } } }), true);
    const sale = mapAmazonOrder({
      orderId: "408-4444444-4444444",
      fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
      orderItems: [
        {
          orderItemId: "1",
          quantityOrdered: 2,
          product: { sellerSku: "SWG-1", title: "Seek" },
          cancellation: { cancellationRequest: { requester: "BUYER" } },
        },
      ],
    });
    assert.equal(sale?.items[0].quantity, 2);
    assert.equal(sale?.cancelled, false);
    assert.equal(sale?.autoApply, true);
    assert.match(sale?.reviewReason || "", /not executed/);
  });

  await test("Amazon poll stops at page cap and reports truncated so the window can retry", async () => {
    process.env.AMAZON_SP_CLIENT_ID = "test-client";
    process.env.AMAZON_SP_CLIENT_SECRET = "test-secret";
    process.env.AMAZON_SP_REFRESH_TOKEN = "test-refresh";
    resetAmazonTokenCache();
    const fetchImpl = async (input: string | URL) => {
      const url = String(input);
      if (url.includes("api.amazon.com/auth/o2/token")) return jsonResponse({ access_token: "t", expires_in: 3600 });
      return jsonResponse({
        orders: [
          {
            orderId: "408-0000003-0000003",
            lastUpdatedTime: "2026-11-09T00:00:00Z",
            fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
            orderItems: [{ orderItemId: "1", quantityOrdered: 1, product: { sellerSku: "A", title: "A" } }],
          },
        ],
        pagination: { nextToken: "still-more" },
      });
    };
    const result = await pollAmazonOrders({
      checkpoint: "2026-11-01T00:00:00.000Z",
      now: new Date("2026-11-10T00:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "", expiresAt: 0 },
      maxPages: 1,
    });
    assert.equal(result.truncated, true);
    assert.equal(result.checkpoint, "2026-11-01T00:00:00.000Z");
    assert.equal(result.sales.length, 1);
    delete process.env.AMAZON_SP_CLIENT_ID;
    delete process.env.AMAZON_SP_CLIENT_SECRET;
    delete process.env.AMAZON_SP_REFRESH_TOKEN;
  });

  await test("ingest decisions: unmatched is review-only; cancelled still syncs stock", () => {
    const unmatched = planIngestActions({ autoApply: true, cancelled: false, needsReview: false, liveMatched: 1, unmatched: 1 });
    assert.equal(unmatched.canTrust, false);
    assert.equal(unmatched.runStockSync, false);
    assert.equal(unmatched.upsertSales, false);
    const cancelled = planIngestActions({ autoApply: false, cancelled: true, needsReview: false, liveMatched: 0, unmatched: 0 });
    assert.equal(cancelled.runStockSync, true);
    assert.equal(cancelled.canTrust, false);
    const fba = planIngestActions({ autoApply: false, cancelled: false, needsReview: true, liveMatched: 1, unmatched: 0 });
    assert.equal(fba.canTrust, false);
    assert.equal(fba.runStockSync, false);
    assert.equal(fba.upsertSales, true);
    const ok = planIngestActions({ autoApply: true, cancelled: false, needsReview: false, liveMatched: 2, unmatched: 0 });
    assert.equal(ok.canTrust, true);
    assert.equal(ok.clearReview, true);
    assert.equal(isSellerApiStale(null, Date.now(), 1000), true);
    assert.equal(isSellerApiStale(new Date(Date.now() - 100), Date.now(), 1000), false);
    assert.equal(isSellerApiStale(new Date(Date.now() - 2000), Date.now(), 1000), true);
  });


  await test("Amazon truncated poll returns a resume token and the next poll continues later pages", async () => {
    process.env.AMAZON_SP_CLIENT_ID = "test-client";
    process.env.AMAZON_SP_CLIENT_SECRET = "test-secret";
    process.env.AMAZON_SP_REFRESH_TOKEN = "test-refresh";
    resetAmazonTokenCache();
    const tokens: string[] = [];
    const fetchImpl = async (input: string | URL) => {
      const url = String(input);
      if (url.includes("api.amazon.com/auth/o2/token")) return jsonResponse({ access_token: "t", expires_in: 3600 });
      const token = new URL(url).searchParams.get("paginationToken") || "";
      tokens.push(token);
      if (token === "page-2") {
        return jsonResponse({
          orders: [
            {
              orderId: "408-0000004-0000004",
              lastUpdatedTime: "2026-11-09T12:00:00Z",
              fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
              orderItems: [{ orderItemId: "2", quantityOrdered: 1, product: { sellerSku: "B", title: "B" } }],
            },
          ],
        });
      }
      return jsonResponse({
        orders: [
          {
            orderId: "408-0000003-0000003",
            lastUpdatedTime: "2026-11-09T00:00:00Z",
            fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
            orderItems: [{ orderItemId: "1", quantityOrdered: 1, product: { sellerSku: "A", title: "A" } }],
          },
        ],
        pagination: { nextToken: "page-2" },
      });
    };
    const first = await pollAmazonOrders({
      checkpoint: "2026-11-01T00:00:00.000Z",
      now: new Date("2026-11-10T00:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "", expiresAt: 0 },
      maxPages: 1,
    });
    assert.equal(first.truncated, true);
    assert.equal(first.checkpoint, "2026-11-01T00:00:00.000Z");
    assert.equal(first.resume?.amazonPaginationToken, "page-2");
    assert.equal(first.sales.length, 1);
    const second = await pollAmazonOrders({
      checkpoint: "2026-11-01T00:00:00.000Z",
      now: new Date("2026-11-10T01:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "t", expiresAt: Date.now() + 60_000 },
      maxPages: 1,
      resume: first.resume,
    });
    assert.equal(second.truncated, false);
    assert.ok(tokens.includes("page-2"));
    assert.equal(second.sales.length, 1);
    assert.equal(second.sales[0].orderKey.includes("408-0000004-0000004") || second.sales[0].externalOrderId.includes("408-0000004-0000004"), true);
    assert.equal(second.resume, null);
    assert.ok(second.checkpoint >= "2026-11-09T12:00:00.000Z");
    delete process.env.AMAZON_SP_CLIENT_ID;
    delete process.env.AMAZON_SP_CLIENT_SECRET;
    delete process.env.AMAZON_SP_REFRESH_TOKEN;
  });

  await test("Flipkart returns for an unknown order stay review-only and do not auto-apply", () => {
    const sale = reviewOnlyFlipkartReturnSale("OD-RET-1", "customer_return", { returnId: "R1", status: "RETURNED" });
    assert.equal(sale.autoApply, false);
    assert.equal(sale.needsReview, true);
    assert.equal(sale.cancelled, false);
    assert.equal(sale.items.length, 0);
    assert.match(sale.reviewReason, /R1/);
    const existing = { ...sale, reviewReason: "already", autoApply: true, needsReview: false } as typeof sale;
    applyFlipkartReturnFlag(existing, "courier_return", { returnId: "R2", status: "COMPLETED" });
    assert.equal(existing.autoApply, false);
    assert.match(existing.reviewReason, /R2/);
  });

  await test("busy or conflicted stock sync is an ingest failure so the checkpoint cannot skip the order", () => {
    assert.equal(isStockSyncFailure("busy"), true);
    assert.equal(isStockSyncFailure("needs_repair"), true);
    assert.equal(isStockSyncFailure("review"), true);
    assert.equal(isStockSyncFailure("error"), true);
    assert.equal(isStockSyncFailure("synced"), false);
  });


  await test("Amazon cancellationExecution without a documented remaining qty keeps stock and flags review", () => {
    const ambiguous = planAmazonItemStock(
      { quantityOrdered: 3, cancellation: { cancellationExecution: { cancelledBy: "BUYER" } }, fulfillment: { quantityFulfilled: 1, quantityUnfulfilled: 1 } },
      "UNSHIPPED"
    );
    assert.equal(ambiguous.quantity, 3);
    assert.equal(ambiguous.lineCancelled, false);
    assert.equal(ambiguous.ambiguousCancel, true);
    const wholeOrder = planAmazonItemStock({ quantityOrdered: 3, cancellation: { cancellationExecution: { cancelledBy: "AMAZON" } } }, "CANCELLED");
    assert.equal(wholeOrder.quantity, 0);
    assert.equal(wholeOrder.lineCancelled, true);
    assert.equal(wholeOrder.ambiguousCancel, false);
    const zeroed = planAmazonItemStock({ quantityOrdered: 0, cancellation: { cancellationExecution: { cancelledBy: "MERCHANT" } } }, "UNSHIPPED");
    assert.equal(zeroed.lineCancelled, true);
    assert.equal(zeroed.quantity, 0);
    const request = planAmazonItemStock({ quantityOrdered: 2, cancellation: { cancellationRequest: { requester: "BUYER" } } }, "UNSHIPPED");
    assert.equal(request.quantity, 2);
    assert.equal(request.ambiguousCancel, false);
  });

  await test("Flipkart outstanding watchlist is capped, drops terminal shipments, and uses official lookup URLs", () => {
    const url = flipkartShipmentsLookupUrl("shipmentIds", ["SHIP-1", "SHIP-2"]);
    assert.equal(url, "https://api.flipkart.net/sellers/v3/shipments?shipmentIds=SHIP-1%2CSHIP-2");
    assert.ok(!url?.includes("/shipments/SHIP"));
    assert.equal(flipkartShipmentsLookupUrl("shipmentIds", ["http://evil", ""]), null);
    const open = collectOutstandingFromShipments(
      [{ shipmentId: "SHIP1", orderItems: [{ orderId: "OD1", status: "APPROVED" }] }],
      "2026-11-01T00:00:00.000Z"
    );
    assert.equal(open[0].shipmentId, "SHIP1");
    const delivered = collectOutstandingFromShipments(
      [{ shipmentId: "SHIP2", orderItems: [{ orderId: "OD2", status: "DELIVERED" }] }],
      "2026-11-01T00:00:00.000Z"
    );
    assert.equal(delivered.length, 0);
    const many = Array.from({ length: 5 }, (_, i) => ({
      shipmentId: `S${i}`,
      orderKey: `FK-S${i}`,
      firstSeenAt: `2026-11-0${i + 1}T00:00:00.000Z`,
    }));
    const merged = mergeOutstanding([], many, 3);
    assert.equal(merged.next.length, 3);
    assert.equal(merged.overflow, 2);
    assert.equal(merged.next[0].shipmentId, "S2");
    const batch = selectOutstandingBatch([
      { shipmentId: "NEW", orderKey: "FK-NEW", firstSeenAt: "2026-11-02T00:00:00.000Z" },
      { shipmentId: "OLD", orderKey: "FK-OLD", firstSeenAt: "2026-11-01T00:00:00.000Z", lastCheckedAt: "2026-11-02T00:00:00.000Z" },
    ], 1, 1);
    assert.deepEqual(batch.shipmentIds, ["NEW"]);
    const refreshed = refreshOutstandingAfterLookup({
      previous: open,
      lookedUpShipments: [{ shipmentId: "SHIP1", orderItems: [{ orderId: "OD1", status: "CANCELLED", cancellationDate: "2026-11-10T00:00:00Z" }] }],
      lookedUpShipmentIds: ["SHIP1"],
      lookedUpOrderIds: [],
      nowIso: "2026-11-10T00:00:00.000Z",
    });
    assert.equal(refreshed.next.length, 0);
  });

  await test("Flipkart later poll looks up outstanding shipment IDs after the orderDate window has moved", async () => {
    process.env.FLIPKART_APP_ID = "app";
    process.env.FLIPKART_APP_SECRET = "secret";
    resetFlipkartTokenCache();
    const calls: string[] = [];
    let lookupCount = 0;
    const fetchImpl = async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      calls.push(`${method} ${url}`);
      if (url.includes("/oauth-service/oauth/token")) return jsonResponse({ access_token: "fk-token", expires_in: 3600 });
      if (url.includes("shipmentIds=")) {
        lookupCount += 1;
        const cancelled = lookupCount > 1;
        return jsonResponse({
          shipments: [
            {
              shipmentId: "SHIP-OPEN",
              updatedAt: cancelled ? "2026-11-20T00:00:00Z" : "2026-11-01T00:00:00Z",
              orderItems: [
                {
                  orderId: "OD-OPEN",
                  orderItemId: "I1",
                  sku: "S1",
                  quantity: 2,
                  status: cancelled ? "CANCELLED" : "APPROVED",
                  cancellationDate: cancelled ? "2026-11-20T00:00:00Z" : undefined,
                  orderDate: "2026-11-01T00:00:00Z",
                },
              ],
            },
          ],
        });
      }
      if (url.includes("v2/returns")) return jsonResponse({ hasMore: false, returnItems: [] });
      if (method === "POST") {
        const body = JSON.parse(String(init?.body || "{}"));
        const from = body?.filter?.orderDate?.from || body?.filter?.cancellationDate?.from || "";
        // First window includes the order date; a later incremental window does not.
        if (from && from >= "2026-11-10T00:00:00.000Z") {
          return jsonResponse({ hasMore: false, shipments: [] });
        }
        if (body?.filter?.type && body.filter.type !== "preDispatch") {
          return jsonResponse({ hasMore: false, shipments: [] });
        }
        return jsonResponse({
          hasMore: false,
          shipments: [
            {
              shipmentId: "SHIP-OPEN",
              updatedAt: "2026-11-01T00:00:00Z",
              orderItems: [
                { orderId: "OD-OPEN", orderItemId: "I1", sku: "S1", quantity: 2, status: "APPROVED", orderDate: "2026-11-01T00:00:00Z" },
              ],
            },
          ],
        });
      }
      return jsonResponse({ hasMore: false, shipments: [] });
    };
    const first = await pollFlipkartOrders({
      now: new Date("2026-11-12T00:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "", expiresAt: 0 },
      maxPages: 3,
    });
    assert.equal(first.truncated, false);
    assert.ok(first.outstanding.some((row) => row.shipmentId === "SHIP-OPEN"));
    assert.ok(first.sales.some((s) => s.externalOrderId === "OD-OPEN" && s.cancelled === false && s.autoApply === true));
    const firstCheckpoint = first.checkpoint;
    const second = await pollFlipkartOrders({
      checkpoint: firstCheckpoint,
      now: new Date("2026-11-21T00:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "fk-token", expiresAt: Date.now() + 60_000 },
      maxPages: 3,
      outstanding: first.outstanding,
    });
    assert.ok(calls.some((c) => c.startsWith("GET ") && c.includes("/sellers/v3/shipments?shipmentIds=")));
    const cancelled = second.sales.find((s) => s.externalOrderId === "OD-OPEN");
    assert.equal(cancelled?.cancelled, true);
    assert.equal(cancelled?.items[0].quantity, 0);
    assert.equal(second.outstanding.some((row) => row.shipmentId === "SHIP-OPEN"), false);
    assert.equal(second.truncated, false);
    // Repeat run with empty outstanding does not look the id up again.
    const before = calls.length;
    const third = await pollFlipkartOrders({
      checkpoint: second.checkpoint,
      now: new Date("2026-11-21T01:00:00.000Z"),
      fetchImpl,
      tokenCache: { accessToken: "fk-token", expiresAt: Date.now() + 60_000 },
      maxPages: 3,
      outstanding: second.outstanding,
    });
    const lookupCallsAfter = calls.slice(before).filter((c) => c.includes("shipmentIds=SHIP-OPEN") || c.includes("shipmentIds=SHIP-OPEN".replace("-", "%2D")));
    assert.equal(lookupCallsAfter.length, 0);
    assert.equal(third.checkpoint >= second.checkpoint || third.checkpoint === second.checkpoint, true);
    delete process.env.FLIPKART_APP_ID;
    delete process.env.FLIPKART_APP_SECRET;
  });

  await test("ingest orchestration with in-memory ledger does not restore stock on an ambiguous Amazon cancel", async () => {
    const orders = new Map<string, { sources: any[]; cancelled: boolean; manualLines: any[] }>();
    const ledger = new Map<string, { quantity: number; productName: string }>();
    const syncCalls: string[] = [];
    const recordSource = async (opts: any) => {
      const prev = orders.get(opts.orderKey) || { sources: [], cancelled: false, manualLines: [] };
      prev.sources = prev.sources.filter((s: any) => s.gmailMessageId !== opts.sourceKey);
      prev.sources.push({ gmailMessageId: opts.sourceKey, trusted: !!opts.trusted, lines: opts.lines || [] });
      if (opts.cancelled) prev.cancelled = true;
      orders.set(opts.orderKey, prev);
      return opts.orderKey;
    };
    const syncStock = async (orderKey: string) => {
      syncCalls.push(orderKey);
      const order = orders.get(orderKey) || { sources: [], cancelled: false, manualLines: [] };
      const desired = planDesiredFromSources(order.sources, order.manualLines, !!order.cancelled);
      const current = new Map(ledger);
      const deltas = planLedgerDeltas(desired, current);
      const cut: any[] = [];
      const restored: any[] = [];
      for (const d of deltas) {
        ledger.set(d.productId, { quantity: d.to, productName: d.productName });
        if (d.delta > 0) cut.push({ productId: d.productId, quantity: d.delta });
        if (d.delta < 0) restored.push({ productId: d.productId, quantity: -d.delta });
      }
      return { status: "synced" as const, orderKey, cut, restored, snapshot: [], note: deltas.length ? "moved" : "Already cut for this order" };
    };
    const deps = {
      getConfig: async () => ({ productAliases: [] }),
      matchProducts: async (items: any[]) => ({
        matched: items.map((i) => ({ productId: "p1", productName: "Seek", quantity: i.quantity })),
        unmatched: [],
      }),
      recordSource,
      syncStock,
      upsertSale: async () => null,
    };
    const live = mapAmazonOrder({
      orderId: "408-5555555-5555555",
      fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
      orderItems: [{ orderItemId: "1", quantityOrdered: 3, product: { sellerSku: "SWG-1", title: "Seek" } }],
    });
    assert.ok(live);
    const first = await ingestSellerApiSale(live!, deps);
    assert.equal(first.status, "ingested");
    assert.equal(ledger.get("p1")?.quantity, 3);
    const ambiguous = mapAmazonOrder({
      orderId: "408-5555555-5555555",
      fulfillment: { fulfillmentStatus: "UNSHIPPED", fulfilledBy: "MERCHANT" },
      orderItems: [
        {
          orderItemId: "1",
          quantityOrdered: 3,
          product: { sellerSku: "SWG-1", title: "Seek" },
          cancellation: { cancellationExecution: { cancelledBy: "BUYER" } },
        },
      ],
    });
    const syncCountBefore = syncCalls.length;
    const reviewed = await ingestSellerApiSale(ambiguous!, deps);
    assert.equal(reviewed.status, "reviewed");
    assert.equal(syncCalls.length, syncCountBefore);
    assert.equal(ledger.get("p1")?.quantity, 3);
    const fullCancel = mapAmazonOrder({
      orderId: "408-5555555-5555555",
      fulfillment: { fulfillmentStatus: "CANCELLED", fulfilledBy: "MERCHANT" },
      orderItems: [
        {
          orderItemId: "1",
          quantityOrdered: 3,
          product: { sellerSku: "SWG-1", title: "Seek" },
          cancellation: { cancellationExecution: { cancelledBy: "AMAZON" } },
        },
      ],
    });
    const cancelled = await ingestSellerApiSale(fullCancel!, deps);
    assert.equal(cancelled.status, "cancelled");
    assert.equal(ledger.get("p1")?.quantity, 0);
  });

  console.log(`\n${passed} tests passed`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
