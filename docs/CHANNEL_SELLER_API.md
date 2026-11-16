# Channel seller API sync (Amazon + Flipkart)

Read-only ingestion of marketplace orders into the **existing** ChannelOrder / ChannelStockOrder / ledger path used by Amazon email sync. This is **not live** until seller accounts are approved, the variables below are set on the server, and a sync has succeeded.

Email sync is unchanged. Notifications are not implemented (Flipkart notification onboarding needs a ticket, VAPT, and NDA).

## Required environment variables

Set these on the **server** (root or `apps/web` / worker environment). Do not put them in client-side `NEXT_PUBLIC_*` variables. Admin screens never receive token values.

### Amazon SP-API (all three required to enable Amazon)

| Name | Purpose |
| --- | --- |
| `AMAZON_SP_CLIENT_ID` | LWA client id from the private developer app |
| `AMAZON_SP_CLIENT_SECRET` | LWA client secret |
| `AMAZON_SP_REFRESH_TOKEN` | Refresh token from self-authorizing the app |

### Flipkart self-access app (both required to enable Flipkart)

| Name | Purpose |
| --- | --- |
| `FLIPKART_APP_ID` | Application id (self-access application) |
| `FLIPKART_APP_SECRET` | Application secret |

If a platform’s variables are missing, that platform is skipped. The other platform and email sync still run.

No other seller-API settings are required. India endpoints, marketplace id, lookback, overlap, page sizes, and rate-limit backoff are fixed in code.

## Fixed (not configurable) settings

- Amazon endpoint: `https://sellingpartnerapi-eu.amazon.com` (India is in the EU selling region)
- Amazon marketplace: `A21TJRUUN4KGV`
- Amazon auth: `POST https://api.amazon.com/auth/o2/token` (`grant_type=refresh_token`)
- Amazon orders: `GET /orders/2026-01-01/orders` with `lastUpdatedAfter`, `includedData=FULFILLMENT,CANCELLATION` (no buyer/recipient PII)
- Flipkart auth: `GET https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api` (HTTP Basic `appId:appSecret`)
- Flipkart orders: `POST /sellers/v3/shipments/filter/` (page size 20), then `GET` on `nextPageUrl`
- Flipkart open-shipment reconcile: official `GET /sellers/v3/shipments?shipmentIds=` (or `orderIds=`), up to 25 IDs per request and 2 requests per poll. This is not the buyer-address path `GET /v3/shipments/{ids}`.
- Flipkart returns (review only): `GET /sellers/v2/returns?source=customer_return|courier_return`
- First sync (no checkpoint): last 30 days
- Later syncs: from the stored checkpoint minus a 2-hour overlap. An outage longer than 30 days does **not** skip the missed window.
- Max 12 pages per Amazon poll, and per Flipkart filter, in one run. If the cap is hit, the checkpoint is **not** advanced and a pagination cursor is stored so the **next poll resumes remaining pages** of the same frozen window (it does not restart at page 1).
- Shared cron auth: existing `CRON_SECRET` (production)

## Account setup (do this later — credentials are not requested now)

**Amazon**

1. Professional seller account and private developer approval: [Register as a private developer](https://developer-docs.amazon.com/sp-api/docs/register-as-a-private-developer)
2. Create a private app with the **Inventory and Order Tracking** role (sufficient for this sync; do not add shipping/PII roles)
3. Self-authorize the app and copy the LWA client id, secret, and refresh token
4. Set the three `AMAZON_SP_*` variables on the server and restart the worker

**Flipkart**

1. In Seller Hub, register a **self-access** application
2. Copy Application Id and Application Secret
3. Set `FLIPKART_APP_ID` and `FLIPKART_APP_SECRET` on the server and restart the worker

## How stock is applied

- Amazon API orders use the **same normalised order id** as email sync. The ledger only moves `desired - already cut`, so repeating the same qty cannot double-cut.
- If a **trusted API source** exists for that order, it is authoritative for current quantity when the official payload states that quantity (for example a Flipkart item in `CANCELLED`, or an Amazon order whose fulfillment status is `CANCELLED`). If there is no trusted API source, desired qty is still the MAX of trusted email sources (the original email policy).
- Flipkart orders use a `FK-` order key so they never collide with Amazon ids.
- Stock is cut only for matched, merchant-fulfilled, non-replacement, non-preorder lines with at least one live item. Whole-order cancellations set the existing `cancelled` flag (stock restore). The flag is never auto-cleared.
- A cancellation *request* without an execution is **not** treated as a cancel (qty stays; the order is flagged for review).
- Official Amazon `cancellationExecution` has only `cancelledBy` and `cancelReason` — no remaining or cancelled quantity. A line is auto-zeroed only when the **order** fulfillment status is `CANCELLED` or `UNFULFILLABLE`, or the line’s `quantityOrdered` is already 0. Any other execution is held for review and **keeps the documented `quantityOrdered`**, so prior stock is not auto-restored. `quantityFulfilled` / `quantityUnfulfilled` are not used as cancelled-qty math.
- **FBA / Flipkart FA** orders are not auto-applied to seller inventory (Flipkart search defaults to NON_FBF; Amazon `fulfilledBy=AMAZON` is held for review).
- **Returns and replacements** are recorded for review. Stock is **not** auto-restored or auto-cut for those cases — existing inventory policy is not extended with invented return semantics.
- Unmatched SKUs are not written as Confirmed sales and do not cut stock. They stay in review until the SKU/alias is fixed and a later poll rematches.
- Product match reuses Amazon SKU (on the product), inventory-item SKU, short forms, and channel-email aliases. Put the marketplace seller SKU in that Amazon SKU field or an alias.

## How to run

Supported launch commands that **do** start the channel-email worker (email + seller API cron):

- `pnpm start:web` — web app and `pnpm worker:channel-email`
- `pnpm start` — `start:web` plus admin (this is what `deploy.sh` starts under PM2)
- `pnpm worker:channel-email` — worker only, polling `CHANNEL_EMAIL_SYNC_URL` (default `http://127.0.0.1:3000/api/cron/channel-email-sync`)

These do **not** start the worker:

- `pnpm start:web-only`, `pnpm dev` / `pnpm dev:web` (unless you also start the worker)
- `docker compose up` / `docker compose up -d` — starts only the `web` and `admin` containers. Compose was not changed to add a worker service. To poll under Compose, start `pnpm worker:channel-email` separately against the web container URL, or use the pnpm/PM2 start path above.

Manual (admin): Inventory → Channel Email Sync → **Sync seller APIs**. The panel shows last successful sync, last error, stale state (no success in 30 minutes), API orders held for review, and (Flipkart) the count of open shipments being watched for later status changes.

Pause without deleting data: use **Pause polling** on that panel, or unset the platform’s environment variables. Credentials (if still in env) and ingested orders/stock rows are kept. Email sync continues.

## Limitations (intentional)

- No Flipkart or Amazon notification / push subscriptions (Flipkart needs a ticket, VAPT, and NDA).
- No auto-restock on returns, courier returns, or replacements.
- No write APIs (no confirm shipment, no cancel, no inventory push).
- First sync only looks back **30 days**. Orders never seen in that bootstrap window are not imported and are not added to the Flipkart outstanding watchlist. Amazon later updates can still appear via `lastUpdatedAfter`. Flipkart cancellations and returns of older orders can still appear via `cancellationDate` / returns `modifiedAfter`. Official Flipkart pre/post-dispatch filters use **orderDate**, not a documented modifiedDate; open shipments already ingested are revisited by the bounded watchlist (`GET /sellers/v3/shipments?shipmentIds=`), capped at 250 IDs (oldest evicted first), 25 IDs per request, 2 requests per poll. Evicted or never-seen historic shipments are not backfilled.
- The email Repair tool now keeps trusted API sources and will not pin `manualLines` over them. It is still email-scan oriented: Flipkart-only API orders are not listed by that scanner.
- Stock sync that returns busy / needs-repair / ledger-conflict is treated as an ingest failure so the checkpoint does not skip the order.
- Marketplace SKUs must already match the catalog (Amazon SKU field or aliases).
- Product-level analytics charts still treat “Amazon” as Amazon-only; Flipkart sales are in Orders → Flipkart and in combined totals, not a full Flipkart analytics suite.

Live verification is pending seller account setup. A successful code deploy or a “credentials present” badge is not a live integration.
