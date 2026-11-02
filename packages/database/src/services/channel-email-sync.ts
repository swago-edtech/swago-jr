import { google } from "googleapis";
import mongoose from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import ChannelEmailConfig from "../models/ChannelEmailConfig";
import ChannelOrderEvent from "../models/ChannelOrderEvent";
import InventoryTransaction from "../models/InventoryTransaction";
import ProductConfig from "../models/ProductConfig";
import { reconcileOrder, netCutByComponent, type BomLine, type ReconcileLine } from "./channel-reconcile";
import {
  matchChannelProducts,
  type ChannelMatchedItem,
  ChannelPartialDeductionError,
} from "./channel-inventory";
import {
  type ExtractedOrder,
  type ParsedItem,
  type CountCheck,
  extractTextFromPayload,
  extractBodiesFromPayload,
  normalizeChannelOrderId,
  enrichItemsWithSkuHints,
  parseSoldShipNowSubject,
  parseAmazonOrderFormat,
  extractExpectedItemCount,
  extractOrderId,
  extractShipBy,
  extractOrderDate,
  checkItemCount,
  buildExtractionPrompt,
  parseExtractedOrder,
} from "./channel-email-parse";
import {
  channelOrderKey,
  recordChannelOrderSource,
  setChannelOrderCancelled,
  setChannelOrderManualLines,
  syncChannelOrderStock,
  getOrderLedger,
  findOrderEvents,
  buildRowForOrder,
  reasonIdsForEvents,
  repairChannelOrders,
  type OrderLine,
  type OrderRepairRow,
} from "./channel-ledger";
const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

type ProductCatalogLean = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
};

type GmailHeader = { name?: string | null; value?: string | null };

export function getGoogleOAuthClient(redirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirect =
    redirectUri ||
    process.env.GOOGLE_REDIRECT_URI ||
    "";

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirect);
}

export function getGmailAuthUrl(redirectUri: string) {
  const client = getGoogleOAuthClient(redirectUri);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
  });
}

export async function completeGmailOAuth(code: string, redirectUri: string) {
  const oauth = getGoogleOAuthClient(redirectUri);
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("Google did not return a refresh token. Disconnect the app and try again.");
  }

  oauth.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: oauth });
  const profile = await gmail.users.getProfile({ userId: "me" });

  const config = await getOrCreateChannelEmailConfig();
  config.refreshToken = tokens.refresh_token;
  config.connectedEmail = profile.data.emailAddress || "";
  config.isEnabled = true;
  config.authError = "";
  config.authErrorAt = null;
  await config.save();
  return sanitizeChannelConfig(config);
}

export async function disconnectGmail() {
  await connectDB();
  const config = await getOrCreateChannelEmailConfig();
  config.refreshToken = "";
  config.connectedEmail = "";
  config.isEnabled = false;
  config.authError = "";
  config.authErrorAt = null;
  await config.save();
  return sanitizeChannelConfig(config);
}

export async function getOrCreateChannelEmailConfig() {
  await connectDB();
  let config = await ChannelEmailConfig.findOne({ isSingleton: true });
  if (!config) {
    config = await ChannelEmailConfig.create({ isSingleton: true });
  }
  return config;
}

export function sanitizeChannelConfig(config: any) {
  const plain = config.toObject ? config.toObject() : config;
  return {
    _id: plain._id,
    isEnabled: plain.isEnabled,
    connectedEmail: plain.connectedEmail || "",
    isConnected: Boolean(plain.refreshToken && plain.connectedEmail),
    authError: plain.authError || "",
    authErrorAt: plain.authErrorAt || null,
    needsReconnect: Boolean(plain.authError) || Boolean(plain.connectedEmail && !plain.refreshToken),
    senderAllowlist: plain.senderAllowlist || [],
    productAliases: (plain.productAliases || []).map((alias: any) => ({
      alias: alias.alias,
      productId: String(alias.productId?._id || alias.productId || ""),
      productName: alias.productName || "",
    })),
    lastHistoryId: plain.lastHistoryId || "",
    lastSyncedAt: plain.lastSyncedAt || null,
  };
}

function isGoogleInvalidGrant(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as {
    code?: number | string;
    message?: string;
    response?: { data?: { error?: string; error_description?: string } };
    errors?: Array<{ message?: string }>;
  };
  const msg = String(err.message || "").toLowerCase();
  const apiError = String(err.response?.data?.error || "").toLowerCase();
  const apiDesc = String(err.response?.data?.error_description || "").toLowerCase();
  const nested = String(err.errors?.[0]?.message || "").toLowerCase();
  return (
    apiError === "invalid_grant" ||
    msg.includes("invalid_grant") ||
    apiDesc.includes("invalid_grant") ||
    nested.includes("invalid_grant") ||
    (Number(err.code) === 400 && (msg.includes("invalid_grant") || apiError === "invalid_grant"))
  );
}

const RECONNECT_MESSAGE =
  "Gmail access expired or was revoked. Connect Gmail once in Admin → Channel Email. Deploys do not clear the token.";

/**
 * When Google permanently rejects the stored refresh token, clear it and stop
 * throwing so the cron/worker does not spam stack traces every few minutes.
 * Keeps connectedEmail so admin still shows which inbox to reconnect.
 * Admin must Connect Gmail once; deploy alone never requires reconnect.
 */
async function markGmailNeedsReconnect(config: any, error: unknown) {
  const detail =
    error instanceof Error ? error.message : "Google rejected the Gmail refresh token";
  const alreadyMarked = !config.refreshToken && Boolean(config.authError);
  if (!alreadyMarked) {
    config.refreshToken = "";
    // Keep connectedEmail so UI can show which inbox was linked
    config.authError = RECONNECT_MESSAGE;
    config.authErrorAt = new Date();
    await config.save();
    console.warn(
      `[channel-email] refresh token invalid_grant — marked needs reconnect (${detail})`
    );
  }
  return {
    processed: 0,
    skipped: 0,
    needsReconnect: true,
    message: config.authError || RECONNECT_MESSAGE,
  };
}

function headerValue(headers: GmailHeader[] | undefined, name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match?.[1] || fromHeader).trim().toLowerCase();
}

export function isAllowedSender(fromHeader: string, allowlist: string[]): boolean {
  const cleaned = allowlist.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!cleaned.length) return true;

  const fromEmail = extractEmailAddress(fromHeader);
  return cleaned.some((allowed) => {
    if (allowed.startsWith("@")) {
      return fromEmail.endsWith(allowed);
    }
    if (allowed.includes("@")) {
      return fromEmail === allowed;
    }
    return fromEmail.includes(allowed);
  });
}

function buildSenderQuery(senders: string[], lastSyncedAt?: Date | null): string {
  // No lastSyncedAt means we've never synced — return impossible query
  // so the first sync only initializes without processing old emails.
  if (!lastSyncedAt) return "not-a-real-email@nowhere.invalid";
  const timeClause = `after:${Math.floor(lastSyncedAt.getTime() / 1000)}`;
  const cleaned = senders.map((s) => s.trim()).filter(Boolean);
  if (!cleaned.length) return timeClause;
  const clause = cleaned.map((sender) => `from:${sender}`).join(" OR ");
  return `{${clause}} ${timeClause}`;
}

/** True only for a clear new-order email — not shipping/updates. */
export function isGenuineNewOrderEmail(input: {
  eventType: string;
  externalOrderId?: string;
  confidence?: number;
  items?: Array<{ title?: string }>;
  subject?: string;
  fromEmail?: string;
}): boolean {
  if (input.eventType !== "order") return false;
  if (!String(input.externalOrderId || "").trim()) return false;
  if (!input.items?.length) return false;

  const subject = String(input.subject || "").toLowerCase();
  const from = String(input.fromEmail || "").toLowerCase();

  const nonOrderSubject =
    /\b(shipped|dispatched|out for delivery|delivered|tracking|shipping update|expected delivery|your package|package update)\b/.test(
      subject
    );
  if (nonOrderSubject) return false;

  const fromAutoConfirm = from.includes("auto-confirm@");
  const orderSubject =
    /\b(order confirmation|new order|sold|congratulations.*order|you('ve| have) .*?order|order confirmed|confirm(ed)? order|action required|amazon\..*order|order.*placed|order.*received|order.*amazon)\b/i.test(
      subject
    );

  // Require a clear new-order signal — do not auto-apply on AI confidence alone.
  return fromAutoConfirm || orderSubject;
}

/** Auto-apply only when the mail is a genuine new order and every line matched a product. */
export function shouldAutoApplyNewOrder(
  matched: Array<{ matchType?: string }>,
  unmatched: string[],
  genuine: boolean
): boolean {
  if (!genuine || !matched.length || unmatched.length) return false;
  return true;
}

async function extractWithGemini(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${system}\n\n${user}` }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

/**
 * Order of preference: local body parser (all item blocks) -> single-item subject parser ->
 * Gemini (last resort, only when the local result is missing or its count disagrees with
 * the "N items sold" the email announces).
 */
async function extractOrderFromEmail(
  subject: string,
  body: string,
  catalog: Array<{ id: string; name: string; slug?: string }>
): Promise<ExtractedOrder> {
  const fallback: ExtractedOrder = {
    eventType: "unknown",
    externalOrderId: "",
    confidence: 0,
    reasoning: "Could not extract order details",
    items: [],
    parseMethod: "none",
  };

  const expected = extractExpectedItemCount(subject, body);
  const shipBy = extractShipBy(body);
  const orderDate = extractOrderDate(body);

  const finalize = (result: ExtractedOrder): ExtractedOrder => ({
    ...result,
    externalOrderId:
      result.externalOrderId || (result.eventType !== "unknown" ? extractOrderId(subject, body) : ""),
    items: enrichItemsWithSkuHints(subject, body, result.items || []),
    expectedItemCount: expected ?? result.expectedItemCount ?? null,
    shipBy: result.shipBy || shipBy || undefined,
    orderDate: result.orderDate || orderDate || undefined,
  });
  const countOk = (r: ExtractedOrder) => checkItemCount(r.items, r.expectedItemCount).ok;

  let best: ExtractedOrder | null = null;
  const localParsed = parseAmazonOrderFormat(body, subject);
  if (localParsed) best = finalize(localParsed);
  if (!best) {
    const subjectParsed = parseSoldShipNowSubject(subject);
    if (subjectParsed) best = finalize(subjectParsed);
  }
  if (best && countOk(best)) return best;

  if (!process.env.GEMINI_API_KEY) {
    return best || { ...fallback, reasoning: "Configure GEMINI_API_KEY for email extraction" };
  }

  try {
    const { system, user } = buildExtractionPrompt(subject, body, catalog, expected);
    const content = await extractWithGemini(system, user);
    if (content) {
      const ai = finalize(parseExtractedOrder(content, fallback));
      if (!best) return ai;
      if (ai.eventType === "order" && ai.items.length && countOk(ai)) {
        return {
          ...ai,
          reasoning: `AI fallback: local parser read ${best.items.length} item(s), AI read ${ai.items.length}. ${ai.reasoning}`.trim(),
        };
      }
    }
  } catch (geminiErr) {
    console.error(
      "[channel-email] Gemini extraction failed:",
      geminiErr instanceof Error ? geminiErr.message : geminiErr
    );
    if (!best) {
      return {
        ...fallback,
        reasoning: geminiErr instanceof Error ? geminiErr.message : "Gemini extraction failed",
      };
    }
  }
  return best || fallback;
}

/** Shape stored in ChannelOrderEvent.extracted (new fields are optional/back-compatible). */
function buildExtractedDoc(extracted: ExtractedOrder, count: CountCheck) {
  return {
    confidence: extracted.confidence,
    reasoning: extracted.reasoning,
    items: (extracted.items || []).map((item: ParsedItem) => ({
      title: item.title,
      quantity: item.quantity,
      sku: item.sku || "",
      price: item.price || "",
    })),
    parseMethod: extracted.parseMethod || "none",
    expectedItemCount: count.expected,
    parsedItemCount: count.parsedLines,
    parsedQuantity: count.parsedQuantity,
    shipBy: extracted.shipBy || "",
    orderDate: extracted.orderDate || "",
  };
}

function mismatchMessage(count: CountCheck) {
  return `${count.note}. Not cutting stock automatically - check the email and confirm.`;
}

/** Normalised per-ORDER key (was the raw stored id, so variants of one id never matched). */
function orderKeyFor(event: any): string {
  return channelOrderKey(event);
}

/**
 * Deterministic event _id from the Gmail message id. ChannelOrderEvent's unique index on
 * gmailMessageId was never created in production (connectDB sets autoIndex:false and no index
 * script covers it), so two concurrent syncs could store the same message twice. `_id` is always
 * unique, so this makes a second insert of the same message fail with E11000.
 */
export function eventIdForMessage(messageId: string): mongoose.Types.ObjectId | undefined {
  const id = String(messageId || "").toLowerCase();
  if (/^[0-9a-f]{1,24}$/.test(id)) return new mongoose.Types.ObjectId(id.padStart(24, "0"));
  return undefined;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


const PROCESSING_STALE_MS = 10 * 60 * 1000;
const SYNC_OVERLAP_MS = 6 * 60 * 60 * 1000;
/** New (not yet stored) messages handled per run; the rest wait for the next run (window not moved). */
const MAX_NEW_PER_SYNC = 200;
/** Ids are cheap to list; this is only a runaway guard. */
const MAX_LISTED_IDS = 20000;
const BODY_LIMIT = 60000;

/**
 * Atomically move the event pending_review/failed -> processing. Only the run that wins
 * this transition may cut stock, so concurrent syncs / double clicks cannot both deduct.
 */
async function claimEventForApply(eventId: unknown) {
  return ChannelOrderEvent.findOneAndUpdate(
    {
      _id: eventId,
      $or: [
        { status: { $in: ["pending_review", "failed"] } },
        { status: "processing", updatedAt: { $lt: new Date(Date.now() - PROCESSING_STALE_MS) } },
      ],
    },
    { $set: { status: "processing", error: "" } },
    { new: true }
  );
}

/**
 * Record this email on its ORDER and bring the order's stock to "desired" via the ledger
 * (desired = MAX over the order's emails, minus what the ledger says is already cut).
 * A duplicate / re-sent email of an already-cut order therefore cuts nothing.
 */
async function applyMatchedOrder(event: any, _reasonId: string, opts: { by?: string; admin?: boolean } = {}) {
  void _reasonId;
  const claimed: any = await claimEventForApply(event._id);
  if (!claimed) {
    // Another run is applying (or already applied) this event
    return ChannelOrderEvent.findById(event._id);
  }
  const lines = (claimed.matchedItems || [])
    .filter((m: any) => m?.productId)
    .map((m: any) => ({ productId: String(m.productId), productName: m.productName || "", quantity: Math.max(1, Number(m.quantity) || 1) }));
  const orderKey = await recordChannelOrderSource(claimed, lines, { trusted: true, by: opts.by || "auto" });
  if (opts.admin) await setChannelOrderCancelled(orderKey, false);
  const r = await syncChannelOrderStock(orderKey, { by: opts.by || "channel-email" });
  const mine = new Set(lines.map((l: any) => l.productId));
  const cutHere = r.cut.filter((c) => mine.has(c.productId));
  const notCut = lines.filter((l: any) => !cutHere.some((c) => c.productId === l.productId)).map((l: any) => l.productName || l.productId);
  let set: Record<string, unknown>;
  if (r.status === "needs_repair" || r.status === "busy" || r.status === "review") {
    set = { status: "pending_review", failureKind: "", error: r.note };
  } else if (r.status === "error" && !r.cut.length) {
    set = { status: "failed", failureKind: "", error: r.note };
  } else if (r.cut.length) {
    set = {
      status: "applied",
      failureKind: "",
      orderKey,
      inventorySnapshot: r.snapshot,
      skippedDuplicates: notCut,
      error: r.status === "error" ? r.note : notCut.length ? `Already cut for this order: ${notCut.join(", ")}` : "",
    };
  } else {
    set = {
      status: "skipped",
      failureKind: "",
      orderKey,
      skippedDuplicates: notCut,
      error: "Same order already cut (duplicate email) - nothing cut again",
    };
  }
  return ChannelOrderEvent.findByIdAndUpdate(claimed._id, { $set: set }, { new: true });
}

/** Products of this order whose stock was already returned (cancelled earlier). */
async function cancelledProductIds(event: any): Promise<Set<string>> {
  const out = new Set<string>();
  if (!event.externalOrderId) return out;
  const rows = (await ChannelOrderEvent.find({
    _id: { $ne: event._id },
    externalOrderId: event.externalOrderId,
    eventType: "order",
    status: "restored",
  })
    .select("matchedItems")
    .lean()) as Array<{ matchedItems?: Array<{ productId?: unknown }> }>;
  for (const row of rows) for (const m of row.matchedItems || []) out.add(String(m.productId || ""));
  out.delete("");
  return out;
}

function audit(action: string, by: string, note = "") {
  return { action, by: by || "admin", at: new Date(), note };
}

/**
 * Interrupted apply (own lock held, unknown whether stock was cut). Admin chooses:
 *  - "mark_applied": stock WAS cut -> mark applied with the planned lines (so a later cancel restores them). No stock change.
 *  - "release_retry": stock was NOT cut -> release this event's locks and return to Needs confirm.
 */
export async function resolveInterruptedChannelEvent(
  eventId: string,
  choice: "mark_applied" | "release_retry",
  by = ""
) {
  await connectDB();
  const claimed: any = await ChannelOrderEvent.findOneAndUpdate(
    { _id: eventId, status: "failed", failureKind: "interrupted" },
    { $set: { status: "processing" } },
    { new: true }
  );
  if (!claimed) throw new Error("This event is not waiting for an interrupted-apply decision");

  // Both choices now go through the order ledger: it replays/checks interrupted moves itself and
  // adopts stock the old code cut, so there is no "release and cut again" path any more.
  await ChannelOrderEvent.updateOne(
    { _id: claimed._id },
    { $set: { status: "pending_review", failureKind: "" }, $push: { auditLog: audit(choice, by, "resolved via order ledger") } }
  );
  return applyMatchedOrder(claimed, "", { by: by || "admin" });
}

/** Pure: replace the match for one extracted item with an admin-picked product. */
export function withManualMatch(
  items: Array<{ title: string; quantity: number }>,
  matched: ChannelMatchedItem[],
  itemIndex: number,
  product: { productId: string; productName: string }
): { matched: ChannelMatchedItem[]; unmatched: string[] } {
  const item = items[itemIndex];
  if (!item) throw new Error("Item not found on this email");
  const next = (matched || []).filter((m) => (m.extractedTitle || "") !== item.title);
  next.push({
    productId: product.productId,
    productName: product.productName,
    quantity: Math.max(1, Number(item.quantity) || 1),
    extractedTitle: item.title,
    matchType: "manual",
  });
  const linked = new Set(next.map((m) => m.extractedTitle || ""));
  return { matched: next, unmatched: items.filter((i) => !linked.has(i.title)).map((i) => i.title) };
}

/** Admin picks the product for one email line (e.g. ambiguous shared-component SKU). */
export async function assignChannelEventProduct(
  eventId: string,
  itemIndex: number,
  productId: string,
  by = ""
) {
  await connectDB();
  const event: any = await ChannelOrderEvent.findById(eventId);
  if (!event) throw new Error("Channel event not found");
  if (event.status !== "pending_review") throw new Error("Only Needs confirm emails can be re-linked");
  if (!mongoose.isValidObjectId(productId)) throw new Error("Invalid product");
  const product: any = await Product.findById(productId).select("_id name").lean();
  if (!product) throw new Error("Product not found");

  const items = ((event.toObject().extracted?.items || []) as any[]).map((i) => ({
    title: String(i.title || ""),
    quantity: Number(i.quantity) || 1,
  }));
  const current = ((event.toObject().matchedItems || []) as any[]).map((m) => ({
    productId: String(m.productId || ""),
    productName: m.productName || "",
    quantity: Number(m.quantity) || 1,
    extractedTitle: m.extractedTitle || "",
    matchType: m.matchType || "",
  }));
  const { matched, unmatched } = withManualMatch(items, current, Number(itemIndex), {
    productId: String(product._id),
    productName: product.name,
  });

  const updated = await ChannelOrderEvent.findOneAndUpdate(
    { _id: event._id, status: "pending_review" },
    {
      $set: {
        matchedItems: matched,
        error: unmatched.length
          ? `Unmatched products: ${unmatched.join(", ")}`
          : String(event.error || "").startsWith("Unmatched")
            ? ""
            : event.error || "",
      },
      $push: {
        auditLog: audit("assign_product", by, `${items[Number(itemIndex)]?.title} -> ${product.name}`),
      },
    },
    { new: true }
  );
  if (!updated) throw new Error("Email changed status, reload and try again");
  return updated;
}
/**
 * Cancellation: the order's desired quantity becomes 0 and the ledger sync returns exactly what is
 * still cut (old orders are first adopted from their actual stock moves). Idempotent: a second
 * cancel email returns nothing.
 */
async function applyCancellation(event: any, _reasonId: string) {
  void _reasonId;
  if (!event.externalOrderId) {
    event.status = "pending_review";
    event.error = "Cancellation email has no marketplace order id";
    await event.save();
    return;
  }
  const orderKey = orderKeyFor(event);
  await setChannelOrderCancelled(orderKey, true);
  const r = await syncChannelOrderStock(orderKey, { by: "channel-email" });
  event.orderKey = orderKey;
  if (r.status !== "synced") {
    event.status = "pending_review";
    event.error = r.note || "Could not return stock";
  } else if (r.restored.length) {
    event.status = "restored";
    event.error = "";
    await ChannelOrderEvent.updateMany(
      { orderKey, eventType: "order", status: "applied" },
      { $set: { status: "restored" } }
    );
  } else {
    event.status = "skipped";
    event.error = "Nothing to return for this order (already returned, or never cut)";
  }
  await event.save();
}
export type ChannelEmailSyncResult = {
  processed: number;
  skipped: number;
  message: string;
  needsReconnect?: boolean;
};

export async function runChannelEmailSync(limit = 25): Promise<ChannelEmailSyncResult> {
  await connectDB();
  const config = await getOrCreateChannelEmailConfig();

  if (!config.isEnabled) {
    return { processed: 0, skipped: 0, message: "Channel email sync is disabled" };
  }
  if (!config.refreshToken) {
    const needsReconnect = Boolean(config.authError || config.connectedEmail);
    return {
      processed: 0,
      skipped: 0,
      needsReconnect,
      message: needsReconnect
        ? config.authError || RECONNECT_MESSAGE
        : "Gmail is not connected",
    };
  }

  const oauth = getGoogleOAuthClient(process.env.GOOGLE_REDIRECT_URI);
  oauth.setCredentials({ refresh_token: config.refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth });

  const allowlist = config.senderAllowlist || [];
  // First sync: initialize lastSyncedAt to now and return — no historical email processing
  if (!config.lastSyncedAt) {
    try {
      // Touch Gmail once so a dead token fails immediately instead of looking "initialized"
      await gmail.users.getProfile({ userId: "me" });
    } catch (error) {
      if (isGoogleInvalidGrant(error)) {
        return markGmailNeedsReconnect(config, error);
      }
      throw error;
    }
    config.lastSyncedAt = new Date(Date.now() - 300_000);
    config.authError = "";
    config.authErrorAt = null;
    await config.save();
    return { processed: 0, skipped: 0, message: "Sync initialized — tracking emails from now onwards" };
  }

  // Overlap the window: Gmail can index a message late. Already-seen ids are skipped cheaply.
  const syncStartedAt = new Date();
  const since = new Date(new Date(config.lastSyncedAt).getTime() - SYNC_OVERLAP_MS);
  const query = buildSenderQuery(allowlist, since);
  const listedMessages: Array<{ id?: string | null }> = [];
  let complete = true;
  try {
    // Page through EVERY match (was: first `limit` only, then lastSyncedAt moved on -> mails lost)
    let pageToken: string | undefined;
    do {
      const page = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: Math.min(100, Math.max(limit, 25)),
        pageToken,
      });
      listedMessages.push(...(page.data.messages || []));
      pageToken = page.data.nextPageToken || undefined;
      if (listedMessages.length >= MAX_LISTED_IDS) {
        complete = !pageToken;
        break;
      }
    } while (pageToken);
  } catch (error) {
    if (isGoogleInvalidGrant(error)) {
      return markGmailNeedsReconnect(config, error);
    }
    throw error;
  }

  // Token worked — clear any prior reconnect flag
  if (config.authError) {
    config.authError = "";
    config.authErrorAt = null;
    await config.save();
  }

  // Oldest first, so an interrupted run never skips older mail
  const messages = [...listedMessages].reverse();
  const catalog = (await Product.find({ isActive: true })
    .select("_id name slug")
    .lean()) as unknown as ProductCatalogLean[];
  const catalogForAi = catalog.map((p) => ({
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
  }));

  let processed = 0;
  let skipped = 0;

  for (const message of messages) {
    if (!message.id) continue;
    if (processed >= MAX_NEW_PER_SYNC) {
      complete = false; // oldest-first, so the next run (same window) continues exactly here
      break;
    }

    const existing = await ChannelOrderEvent.findOne({
      $or: [{ gmailMessageId: message.id }, ...(eventIdForMessage(message.id) ? [{ _id: eventIdForMessage(message.id) }] : [])],
    }).select("_id");
    if (existing) {
      skipped += 1;
      continue;
    }

    let full;
    try {
      full = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });
    } catch (error) {
      if (isGoogleInvalidGrant(error)) {
        return markGmailNeedsReconnect(config, error);
      }
      throw error;
    }

    const headers = (full.data.payload?.headers || []) as GmailHeader[];
    const subject = headerValue(headers, "Subject");
    const fromEmail = headerValue(headers, "From");
    const receivedAt = full.data.internalDate
      ? new Date(Number(full.data.internalDate))
      : new Date();

    if (!isAllowedSender(fromEmail, allowlist)) {
      try {
        await ChannelOrderEvent.create({
          _id: eventIdForMessage(message.id),
          gmailMessageId: message.id,
          channel: "amazon",
          eventType: "unknown",
          status: "skipped",
          fromEmail,
          subject,
          receivedAt,
          error: "Sender not in allowlist",
        });
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
      }
      skipped += 1;
      continue;
    }

    // Parse plain AND html: some mails list every item only in one of them
    const bodies = extractBodiesFromPayload(full.data.payload);
    let rawText = (bodies.plain || bodies.html).slice(0, BODY_LIMIT);
    let extracted = await extractOrderFromEmail(subject, rawText, catalogForAi);
    if (bodies.plain && bodies.html) {
      const firstOk = checkItemCount(extracted.items, extracted.expectedItemCount).ok;
      if (!firstOk) {
        const htmlText = bodies.html.slice(0, BODY_LIMIT);
        const alt = await extractOrderFromEmail(subject, htmlText, catalogForAi);
        if (checkItemCount(alt.items, alt.expectedItemCount).ok || alt.items.length > extracted.items.length) {
          extracted = alt;
          rawText = htmlText;
        }
      }
    }
    const { matched, unmatched } = await matchChannelProducts(
      extracted.items,
      config.productAliases || []
    );
    const count = checkItemCount(extracted.items, extracted.expectedItemCount);

    let event: any;
    try {
      event = await ChannelOrderEvent.create({
        _id: eventIdForMessage(message.id),
        gmailMessageId: message.id,
        channel: "amazon",
        eventType: extracted.eventType,
        status: "pending_review",
        externalOrderId: normalizeChannelOrderId(extracted.externalOrderId),
        orderKey: extracted.externalOrderId ? normalizeChannelOrderId(extracted.externalOrderId) : "",
        fromEmail,
        subject,
        receivedAt,
        rawText,
        extracted: buildExtractedDoc(extracted, count),
        matchedItems: matched,
      });
    } catch (error: any) {
      // Another concurrent run already stored this Gmail message (unique gmailMessageId)
      if (error?.code === 11000) {
        skipped += 1;
        continue;
      }
      throw error;
    }

    try {
      const reasonId = extracted.externalOrderId
        ? `CH-${normalizeChannelOrderId(extracted.externalOrderId)}`
        : `CH-MSG-${message.id.slice(-8)}`;

      if (extracted.eventType === "unknown" || !extracted.items.length) {
        event.status = extracted.eventType === "unknown" ? "skipped" : "pending_review";
        event.error =
          extracted.eventType !== "unknown" && count.expected
            ? `Expected ${count.expected} items, parsed 0 - confirm before cutting stock`
            : unmatched.join("; ") || extracted.reasoning;
        await event.save();
      } else if (extracted.eventType === "cancel") {
        await applyCancellation(event, reasonId);
      } else if (!extracted.externalOrderId) {
        event.status = "pending_review";
        event.error = "No marketplace order id - confirm before cutting stock";
        await event.save();
      } else if (!count.ok) {
        event.status = "pending_review";
        event.error = mismatchMessage(count);
        await event.save();
      } else {
        const genuine = isGenuineNewOrderEmail({
          eventType: extracted.eventType,
          externalOrderId: extracted.externalOrderId,
          confidence: extracted.confidence,
          items: extracted.items,
          subject,
          fromEmail,
        });
        const cancelled = await cancelledProductIds(event);
        const reCancelled = matched.some((m) => cancelled.has(String(m.productId)));
        if (reCancelled) {
          event.status = "pending_review";
          event.error =
            "This order was cancelled earlier and its stock was returned. Confirm only if it is a genuine new sale.";
          await event.save();
        } else if (shouldAutoApplyNewOrder(matched, unmatched, genuine)) {
          await applyMatchedOrder(event, reasonId);
        } else {
          event.status = "pending_review";
          event.error = unmatched.length
            ? `Unmatched products: ${unmatched.join(", ")}`
            : genuine
              ? "Products need a closer look before cutting stock"
              : "Not a clear new-order email - confirm before cutting stock";
          await event.save();
        }
      }
    } catch (error) {
      await ChannelOrderEvent.updateOne(
        { _id: event._id, status: { $ne: "applied" } },
        {
          $set: {
            status: "failed",
            error: error instanceof Error ? error.message : "Failed to update inventory",
          },
        }
      );
    }
    processed += 1;
  }

  // Only move the window when every listed message was handled
  if (complete) {
    config.lastSyncedAt = syncStartedAt;
    await config.save();
  }

  return {
    processed,
    skipped,
    message: `Processed ${processed} new emails${complete ? "" : " (more waiting - next run continues)"}`,
  };
}

export async function rematchChannelEvent(eventId: string) {
  await connectDB();
  const event: any = await ChannelOrderEvent.findById(eventId);
  if (!event) throw new Error("Channel event not found");
  if (["applied", "restored", "ignored", "processing"].includes(event.status)) {
    return event;
  }

  const config = await getOrCreateChannelEmailConfig();
  const subject = event.subject || "";
  const body = event.rawText || "";
  const prev = (event.toObject().extracted || {}) as any;

  let items: ParsedItem[] = (prev.items || []).map((item: any) => ({
    title: String(item.title || "").trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
    sku: String(item.sku || "").trim() || undefined,
    price: String(item.price || "").trim() || undefined,
  }));
  let parseMethod = prev.parseMethod || "";
  let reasoning = prev.reasoning || "";
  let confidence = Number(prev.confidence) || 0;
  const expected =
    extractExpectedItemCount(subject, body) ??
    (typeof prev.expectedItemCount === "number" ? prev.expectedItemCount : null);

  // Re-read the stored email with the current multi-item parser (heals older single-item rows)
  const reparsed = parseAmazonOrderFormat(body, subject) || parseSoldShipNowSubject(subject);
  if (reparsed?.items.length) {
    const storedQty = items.reduce((s, i) => s + i.quantity, 0);
    const reparsedQty = reparsed.items.reduce((s, i) => s + i.quantity, 0);
    if (!items.length || checkItemCount(reparsed.items, expected).ok || reparsedQty > storedQty) {
      items = reparsed.items;
      parseMethod = reparsed.parseMethod || parseMethod;
      reasoning = reparsed.reasoning;
      confidence = Math.max(confidence, reparsed.confidence);
      if (!event.externalOrderId && reparsed.externalOrderId) {
        event.externalOrderId = normalizeChannelOrderId(reparsed.externalOrderId);
      }
      if (event.eventType === "unknown") event.eventType = "order";
    }
  }
  items = enrichItemsWithSkuHints(subject, body, items);
  const count = checkItemCount(items, expected);

  event.set(
    "extracted",
    buildExtractedDoc(
      {
        eventType: event.eventType,
        externalOrderId: event.externalOrderId,
        confidence,
        reasoning,
        items,
        parseMethod: parseMethod || "none",
        shipBy: prev.shipBy || extractShipBy(body) || undefined,
        orderDate: prev.orderDate || extractOrderDate(body) || undefined,
      },
      count
    )
  );

  const { matched, unmatched } = await matchChannelProducts(items, config?.productAliases || []);
  event.matchedItems = matched;
  event.error = unmatched.length
    ? `Unmatched products: ${unmatched.join(", ")}`
    : !count.ok
      ? mismatchMessage(count)
      : matched.length
        ? ""
        : event.error || "No products found to match";
  await event.save();
  return event;
}

// ---------------------------------------------------------------------------
// Re-check old applied "N items sold" orders that the old parser cut only partly
// ---------------------------------------------------------------------------

/** Pure: "Sold, ship now: 3 items sold" -> 3 (null when not stated). */
export function itemsSoldFromSubject(subject: string): number | null {
  const m = String(subject || "").match(/(\d+)\s+items?\s+sold/i);
  return m ? Number(m[1]) : null;
}

/** Pure: should an applied order show "Re-check items"? */
export function needsItemRecheck(event: {
  status?: string;
  eventType?: string;
  subject?: string;
  extracted?: { expectedItemCount?: number | null; parsedItemCount?: number; parsedQuantity?: number } | null;
}): boolean {
  if (event.status !== "applied" || event.eventType === "cancel") return false;
  const ex = event.extracted || {};
  const n = itemsSoldFromSubject(event.subject || "");
  if (n && n > 1) return true;
  const expected = typeof ex.expectedItemCount === "number" ? ex.expectedItemCount : null;
  if (expected && expected > 1) {
    const parsed = Math.max(Number(ex.parsedItemCount) || 0, Number(ex.parsedQuantity) || 0);
    return expected > parsed || expected > 1;
  }
  return false;
}

/**
 * Pure: lines still to cut = wanted products minus every product already cut for this order
 * (this event's applied lines / keys / locks, legacy matched products, other events' locks).
 * A product already cut is NEVER cut again, even if the new parse shows a larger quantity.
 */
export function computeMissingLines(
  wanted: ChannelMatchedItem[],
  alreadyCut: Set<string>
): ChannelMatchedItem[] {
  const merged = new Map<string, ChannelMatchedItem>();
  for (const w of wanted || []) {
    const id = String(w.productId || "");
    if (!id || alreadyCut.has(id)) continue;
    const prev = merged.get(id);
    const q = Math.max(1, Number(w.quantity) || 1);
    if (prev) prev.quantity += q;
    else merged.set(id, { ...w, productId: id, quantity: q });
  }
  return [...merged.values()];
}

/** Read-only: fetch the original email body from Gmail by message id ("" when not possible). */
async function fetchGmailBodyText(messageId: string): Promise<string> {
  if (!messageId) return "";
  const config = await getOrCreateChannelEmailConfig();
  if (!config?.refreshToken) return "";
  try {
    const oauth = getGoogleOAuthClient(process.env.GOOGLE_REDIRECT_URI);
    oauth.setCredentials({ refresh_token: config.refreshToken });
    const gmail = google.gmail({ version: "v1", auth: oauth });
    const full = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
    return extractTextFromPayload(full.data.payload).slice(0, 20000);
  } catch (error) {
    console.error("[channel-email] Gmail re-fetch failed:", error instanceof Error ? error.message : error);
    return "";
  }
}

function reasonIdFor(event: any): string {
  return event.externalOrderId
    ? `CH-${event.externalOrderId}`
    : `CH-MSG-${String(event.gmailMessageId || "").slice(-8)}`;
}

export type RecheckItemRow = {
  title: string;
  sku: string;
  quantity: number;
  productId: string;
  productName: string;
  matchType: string;
  /** true when the SKU/title did not match any active product */
  unmatched: boolean;
};

export type RecheckPreviewResult = {
  orderId: string;
  expected: number | null;
  parsedLines: number;
  parsedQuantity: number;
  parseMethod: string;
  /** where the email text came from */
  bodySource: "stored" | "gmail" | "none";
  items: RecheckItemRow[];
  /** per product: expected / already cut / missing / extra */
  lines: ReconcileLine[];
  alreadyCut: Array<{ productId: string; productName: string; quantity: number }>;
  missing: Array<{ productId: string; productName: string; quantity: number }>;
  /** cut more than the email says (possible double deduction) - manual review only */
  overCut: Array<{ productId: string; productName: string; quantity: number }>;
  /** inventory deducted under this order id that no listed product explains */
  unexplained: Array<{ inventoryItemId: string; inventoryItemName: string; quantity: number }>;
  unmatched: string[];
  /** reasons the automatic cut is not safe (shown to admin) */
  blockers: string[];
  emailMissingProduct: boolean;
  manualAllowance: number;
};

/**
 * Re-parse the ORIGINAL email (stored body, else Gmail by message id), match every SKU,
 * and compare with what was actually deducted for this order (InventoryTransaction rows
 * under the order's reason id; falls back to locks / recorded rows). No writes.
 */
async function buildOrderReconciliation(
  event: any,
  opts: { allowGmail?: boolean } = {}
): Promise<RecheckPreviewResult & { _body: string }> {
  const config = await getOrCreateChannelEmailConfig();
  const subject = event.subject || "";
  const catalog = (await Product.find({ isActive: true }).select("_id name slug").lean()) as any[];
  const catalogForAi = catalog.map((p) => ({ id: String(p._id), name: p.name, slug: p.slug }));

  let body = String(event.rawText || "");
  let bodySource: RecheckPreviewResult["bodySource"] = body.trim() ? "stored" : "none";
  let extracted = await extractOrderFromEmail(subject, body, catalogForAi);
  const subjectN = itemsSoldFromSubject(subject);
  const isShort = (ex: ExtractedOrder) => {
    const exp = ex.expectedItemCount ?? subjectN;
    return !ex.items.length || !checkItemCount(ex.items, exp).ok;
  };
  if (isShort(extracted) && opts.allowGmail !== false && event.gmailMessageId) {
    const fresh = await fetchGmailBodyText(String(event.gmailMessageId));
    if (fresh.trim()) {
      const ex2 = await extractOrderFromEmail(subject, fresh, catalogForAi);
      if (!isShort(ex2) || ex2.items.length > extracted.items.length) {
        extracted = ex2;
        body = fresh;
        bodySource = "gmail";
      }
    }
  }

  const expected =
    extracted.expectedItemCount ??
    subjectN ??
    (typeof event.extracted?.expectedItemCount === "number" ? event.extracted.expectedItemCount : null);
  const count = checkItemCount(extracted.items || [], expected);

  // Match each item on its own so every row shows its own match / unmatched SKU
  const items: RecheckItemRow[] = [];
  for (const item of extracted.items || []) {
    const { matched } = await matchChannelProducts([item], config?.productAliases || []);
    const m = matched[0];
    items.push({
      title: item.title,
      sku: item.sku || "",
      quantity: Math.max(1, Number(item.quantity) || 1),
      productId: m ? String(m.productId) : "",
      productName: m?.productName || "",
      matchType: m?.matchType || "",
      unmatched: !m,
    });
  }
  const unmatched = items.filter((i) => i.unmatched).map((i) => (i.sku ? `${i.sku} (${i.title.slice(0, 60)})` : i.title));

  // What was cut for this ORDER (all its emails), not for this one event
  const orderKey = orderKeyFor(event);
  const recorded = new Map<string, number>();
  const names = new Map<string, string>();
  const ledger = await getOrderLedger(orderKey);
  const orderEvents = await findOrderEvents(orderKey);
  for (const row of orderEvents) {
    for (const m of row.matchedItems || []) names.set(String(m.productId), m.productName);
  }
  let netCut: Map<string, number> | null = null;
  let invNames = new Map<string, string>();
  let legacyOrder = false;
  if (ledger.length) {
    // Ledger = the single source of truth for what this order has cut
    for (const l of ledger) {
      recorded.set(String(l.productId), Number(l.quantity) || 0);
      names.set(String(l.productId), l.productName);
    }
  } else {
    // Ground truth: inventory rows under ANY reason id this order was cut with
    const txs = (await InventoryTransaction.find({ orderId: { $in: reasonIdsForEvents(orderKey, orderEvents) } })
      .select("inventoryItemId inventoryItemName type quantity")
      .lean()) as any[];
    invNames = new Map<string, string>(txs.map((t) => [String(t.inventoryItemId), t.inventoryItemName || ""]));
    netCut = txs.length ? netCutByComponent(txs) : null;
    legacyOrder = txs.length > 0;
    for (const row of orderEvents.filter((e: any) => e.eventType === "order" && e.status === "applied")) {
      for (const m of row.matchedItems || []) {
        const id = String(m.productId || "");
        // MAX across emails (duplicates are the same items, never added up)
        if (id) recorded.set(id, Math.max(recorded.get(id) || 0, Math.max(1, Number(m.quantity) || 1)));
      }
    }
  }

  const wanted = items
    .filter((i) => i.productId)
    .map((i) => ({ productId: i.productId, productName: i.productName, quantity: i.quantity }));
  for (const w of wanted) names.set(w.productId, w.productName);
  const others = [...recorded.keys()].map((id) => ({ productId: id, productName: names.get(id) || id }));
  const productIds = [...new Set([...wanted.map((w) => w.productId), ...recorded.keys()])].filter((id) =>
    mongoose.isValidObjectId(id)
  );
  const configs = (await ProductConfig.find({ productId: { $in: productIds }, isActive: true })
    .select("productId components")
    .lean()) as any[];
  const boms: Record<string, BomLine[]> = {};
  for (const c of configs) {
    boms[String(c.productId)] = (c.components || []).map((x: any) => ({
      inventoryItemId: String(x.inventoryItemId),
      quantity: Number(x.quantity) || 0,
    }));
  }
  const { lines, unexplained } = reconcileOrder({ wanted, others, recorded, boms, netCut });
  for (const l of lines) if (!l.productName || l.productName === l.productId) l.productName = names.get(l.productId) || l.productId;

  const blockers: string[] = [];
  if (!items.length) blockers.push("Could not read any item from the email (stored body empty and Gmail re-fetch failed)");
  if (unmatched.length) blockers.push(`SKU not matched to an active product: ${unmatched.join(", ")}`);
  if (!count.ok) blockers.push(count.note);
  if (legacyOrder && (await buildRowForOrder(orderKey)).action !== "ok") {
    blockers.push(
      "Cut by the old sync (before the order ledger) - use Backfill / Repair, which reconciles the whole order across all its emails"
    );
  }

  const missing = lines.filter((l) => l.missingQty > 0).map((l) => ({ productId: l.productId, productName: l.productName, quantity: l.missingQty }));
  const overCut = lines.filter((l) => l.extraQty > 0).map((l) => ({ productId: l.productId, productName: l.productName, quantity: l.extraQty }));
  const cutTotal = lines.reduce((s, l) => s + Math.min(l.cutQty, l.expectedQty), 0);
  const missingTotal = missing.reduce((s, m) => s + m.quantity, 0);
  const emailShort = typeof expected === "number" && count.parsedQuantity < expected;

  return {
    _body: body,
    orderId: event.externalOrderId || "",
    expected,
    parsedLines: count.parsedLines,
    parsedQuantity: count.parsedQuantity,
    parseMethod: extracted.parseMethod || "none",
    bodySource,
    items,
    lines,
    alreadyCut: lines.filter((l) => l.cutQty > 0).map((l) => ({ productId: l.productId, productName: l.productName, quantity: l.cutQty })),
    missing,
    overCut,
    unexplained: unexplained.map((u) => ({ ...u, inventoryItemName: invNames.get(u.inventoryItemId) || u.inventoryItemId })),
    unmatched,
    blockers,
    emailMissingProduct: emailShort,
    manualAllowance:
      typeof expected === "number" && emailShort ? Math.max(0, expected - cutTotal - missingTotal) : 0,
  };
}

/** Read-only preview for "Re-check items". No writes. */
export async function recheckChannelEvent(eventId: string): Promise<RecheckPreviewResult> {
  await connectDB();
  const event: any = await ChannelOrderEvent.findById(eventId);
  if (!event) throw new Error("Channel event not found");
  if (event.status !== "applied" || event.eventType === "cancel") {
    throw new Error("Only applied (Stock cut) orders can be re-checked");
  }
  const { _body, ...preview } = await buildOrderReconciliation(event, { allowGmail: true });
  void _body;
  return preview;
}

const RECHECK_STALE_MS = 10 * 60 * 1000;

/**
 * Cut ONLY the missing quantity for an applied order. The server recomputes what is missing
 * per ORDER (all its emails, ledger quantities); the cut goes through the order ledger, so it
 * can never be repeated (no more "|topup" second cut). Manual picks (product not in the email) are
 * allowed only within the email's unaccounted units.
 */
export async function cutMissingChannelItems(
  eventId: string,
  lines: Array<{ productId: string; quantity: number }>,
  by = "",
  opts: { action?: string } = {}
) {
  await connectDB();
  if (!Array.isArray(lines) || !lines.length) throw new Error("Nothing to cut");
  if (lines.length > 20) throw new Error("Too many lines");

  const claimed: any = await ChannelOrderEvent.findOneAndUpdate(
    {
      _id: eventId,
      status: "applied",
      eventType: { $ne: "cancel" },
      $or: [
        { recheckLockAt: null },
        { recheckLockAt: { $exists: false } },
        { recheckLockAt: { $lt: new Date(Date.now() - RECHECK_STALE_MS) } },
      ],
    },
    { $set: { recheckLockAt: new Date() } },
    { new: true }
  );
  if (!claimed) throw new Error("Order is not applied or another re-check is running; reload and try again");

  const unclaim = () =>
    ChannelOrderEvent.updateOne({ _id: claimed._id }, { $set: { recheckLockAt: null } });

  const acquired: string[] = [];
  let deducted = false;
  try {
    const recon = await buildOrderReconciliation(claimed, { allowGmail: true });
    const missingById = new Map(recon.missing.map((m) => [m.productId, m]));
    const inEmail = new Set(recon.lines.filter((l) => l.expectedQty > 0).map((l) => l.productId));
    let manualLeft = recon.manualAllowance;

    const wanted: ChannelMatchedItem[] = [];
    const skipped: string[] = [];
    for (const line of lines) {
      const id = String(line?.productId || "");
      if (!mongoose.isValidObjectId(id)) throw new Error("Invalid product");
      const asked = Math.floor(Number(line.quantity) || 0);
      if (asked < 1 || asked > 50) throw new Error("Quantity must be 1-50");
      const miss = missingById.get(id);
      if (miss) {
        wanted.push({ productId: id, productName: miss.productName, quantity: Math.min(asked, miss.quantity), matchType: "recheck" });
        continue;
      }
      if (inEmail.has(id) || recon.lines.some((l) => l.productId === id && l.cutQty > 0)) {
        skipped.push(recon.lines.find((l) => l.productId === id)?.productName || id);
        continue;
      }
      // Manual pick for a product the email doesn't list
      const product: any = await Product.findById(id).select("_id name").lean();
      if (!product) throw new Error("Product not found");
      if (asked > manualLeft) {
        throw new Error(`Email says ${recon.expected ?? "?"} item(s); at most ${manualLeft} more can be picked by hand`);
      }
      manualLeft -= asked;
      wanted.push({ productId: id, productName: product.name, quantity: asked, matchType: "recheck_manual" });
    }
    if (!wanted.length) {
      throw new Error(`Nothing missing for this order${skipped.length ? ` (already cut: ${skipped.join(", ")})` : ""}. Nothing cut.`);
    }

    if (recon.blockers.some((b) => b.startsWith("Cut by the old sync"))) {
      throw new Error("This order was cut by the old sync and does not match the email. Run Backfill / Repair (dry run first) - it fixes the whole order.");
    }
    // Set the ORDER's desired TOTAL per product from the email (never "+ missing"): the ledger
    // cuts desired - already cut, so a second click or a duplicate row cuts nothing.
    const orderKey = orderKeyFor(claimed);
    const picked = new Set(wanted.map((w) => String(w.productId)));
    const totals = new Map<string, OrderLine>();
    for (const i of recon.items) {
      if (!i.productId || !picked.has(String(i.productId))) continue;
      const prev = totals.get(String(i.productId));
      const q = Math.max(1, Number(i.quantity) || 1);
      if (prev) prev.quantity += q;
      else totals.set(String(i.productId), { productId: String(i.productId), productName: i.productName || "", quantity: q });
    }
    const ledgerNow = new Map((await getOrderLedger(orderKey)).map((l: any) => [String(l.productId), Number(l.quantity) || 0]));
    for (const w of wanted) {
      // Admin pick of a product the email does not list (bounded by manualAllowance above)
      if (w.matchType !== "recheck_manual") continue;
      const id = String(w.productId);
      totals.set(id, { productId: id, productName: w.productName, quantity: (ledgerNow.get(id) || 0) + w.quantity });
    }
    const manual: OrderLine[] = [...totals.values()];
    await recordChannelOrderSource(claimed, (claimed.matchedItems || []).map((m: any) => ({ productId: String(m.productId), productName: m.productName, quantity: m.quantity })), { trusted: true, by });
    await setChannelOrderManualLines(orderKey, manual);
    deducted = true;
    const r = await syncChannelOrderStock(orderKey, { by: by || "admin" });
    if (r.status !== "synced" && !r.cut.length) {
      deducted = false;
      throw new Error(r.note || "Could not cut stock");
    }
    if (!r.cut.length) {
      deducted = false;
      throw new Error("Nothing to cut - this order is already fully cut");
    }
    const note = r.cut.map((i) => `${i.productName} x${i.quantity}`).join(", ") || "nothing (already cut)";
    const action = opts.action || "cut_missing";
    const existingIds = new Set((claimed.matchedItems || []).map((m: any) => String(m.productId)));
    await ChannelOrderEvent.updateOne(
      { _id: claimed._id },
      {
        $push: {
          matchedItems: { $each: wanted.filter((w) => !existingIds.has(String(w.productId))) },
          inventorySnapshot: { $each: r.snapshot },
          auditLog: audit(action, by, r.status === "synced" ? note : `${note} - ${r.note}`),
        },
        $set: {
          recheckLockAt: null,
          orderKey,
          ...(recon.bodySource === "gmail" && !String(claimed.rawText || "").trim() ? { rawText: recon._body } : {}),
          error: r.status === "synced" ? (skipped.length ? `Skipped (already cut): ${skipped.join(", ")}` : claimed.error || "") : r.note,
        },
      }
    );
    return ChannelOrderEvent.findById(claimed._id);
  } catch (error) {
    void acquired;
    await unclaim();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// One-time backfill of old applied orders (dry-run first, then apply)
// ---------------------------------------------------------------------------

export type BackfillRow = {
  eventId: string;
  orderId: string;
  subject: string;
  receivedAt: string | null;
  bodySource: string;
  missing: Array<{ productName: string; quantity: number }>;
  overCut: Array<{ productName: string; quantity: number }>;
  unexplained: Array<{ inventoryItemName: string; quantity: number }>;
  blockers: string[];
  /** cut = will fix (cut and/or return stock); ok = nothing to do; review = needs a human */
  action: "cut" | "ok" | "review";
  result?: string;
  desired?: Array<{ productName: string; quantity: number }>;
  components?: Array<{ inventoryItemId: string; inventoryItemName: string; expected: number; actual: number; diff: number }>;
  duplicates?: number;
  emails?: number;
};

/** Re-parse one email (stored body, else Gmail) for the repair; lines only when the count is OK and all SKUs match. */
async function reparseEventForRepair(event: any): Promise<OrderLine[] | null> {
  const recon = await buildOrderReconciliation(event, { allowGmail: true });
  if (recon.unmatched.length || recon.blockers.some((b) => !b.startsWith("Cut by the old sync"))) return null;
  const lines = recon.items.filter((i) => i.productId).map((i) => ({ productId: i.productId, productName: i.productName, quantity: i.quantity }));
  return lines.length ? lines : null;
}

function toBackfillRow(r: OrderRepairRow): BackfillRow {
  return {
    eventId: r.eventIds[0] || r.orderId,
    orderId: r.orderId,
    subject: "",
    receivedAt: null,
    bodySource: "",
    missing: r.toCut.map((c) => ({ productName: c.inventoryItemName, quantity: c.quantity })),
    overCut: r.toRestore.map((c) => ({ productName: c.inventoryItemName, quantity: c.quantity })),
    unexplained: [],
    blockers: r.blockers,
    action: r.action === "fix" ? "cut" : r.action,
    result: r.result,
    desired: r.desired.map((d) => ({ productName: d.productName, quantity: d.quantity })),
    components: r.components,
    duplicates: r.duplicateEventIds.length,
    emails: r.eventIds.length,
  };
}

/**
 * One-time repair of old orders, per ORDER across all its emails (was: per event, current BOM vs
 * one email, which double-cut). Dry run by default: lists expected vs actual component cuts.
 * Apply needs confirm "REPAIR" + the order ids from the dry run; it returns over-cut stock, cuts
 * under-cut stock, seeds the ledger and marks duplicate emails. Re-running changes nothing.
 */
export async function backfillChannelOrders(
  opts: { apply?: boolean; confirm?: string; orderIds?: string[]; by?: string; limit?: number; since?: Date | null } = {}
) {
  await connectDB();
  const { summary, rows } = await repairChannelOrders({ ...opts, reparse: reparseEventForRepair });
  return {
    summary: {
      scanned: summary.scanned,
      toCut: summary.toFix,
      ok: summary.ok,
      review: summary.review,
      duplicates: summary.duplicates,
      applied: summary.applied,
    },
    rows: rows.map(toBackfillRow),
  };
}

type ChannelSnapshotLineLike = { inventoryItemId: any; inventoryItemName: string; quantity: number };

export async function applyChannelEvent(eventId: string, by = "") {
  await connectDB();
  let event: any = await ChannelOrderEvent.findById(eventId);
  if (!event) throw new Error("Channel event not found");
  // "processing" is let through: the atomic claim only takes it over when stale (>10 min)
  if (["applied", "restored", "ignored"].includes(event.status)) {
    return event;
  }

  const reasonId = event.externalOrderId
    ? `CH-${event.externalOrderId}`
    : `CH-MSG-${event.gmailMessageId.slice(-8)}`;

  if (event.eventType === "cancel") {
    await applyCancellation(event, reasonId);
    return event;
  }

  // Rematch with current aliases + SKU before applying (fixes older unmatched rows)
  if (!event.matchedItems?.length) {
    event = await rematchChannelEvent(eventId);
  }
  if (!event.matchedItems?.length) {
    throw new Error(
      "Still no catalog match. Add a product alias or set the inventory SKU, then click Match again."
    );
  }

  // Manual confirm: admin has reviewed the email, so a count mismatch does not block here.
  // Per-product dedupe + atomic claim inside applyMatchedOrder prevents double deduction.
  if (event.failureKind === "interrupted") {
    throw new Error('Interrupted apply: choose "Mark as applied" or "Release & retry" first.');
  }
  const wasFailed = event.status === "failed";
  const updated = await applyMatchedOrder(event, reasonId, { by: by || "admin", admin: true });
  await ChannelOrderEvent.updateOne(
    { _id: event._id },
    { $push: { auditLog: audit(wasFailed ? "retry" : "confirm", by, String(updated?.status || "")) } }
  );
  return updated || event;
}
export async function ignoreChannelEvent(eventId: string) {
  await connectDB();
  const event = await ChannelOrderEvent.findOneAndUpdate(
    // Never hide an applied/processing order (its stock cut + locks would be orphaned)
    { _id: eventId, status: { $nin: ["applied", "restored", "processing"] } },
    { $set: { status: "ignored", error: "" } },
    { new: true }
  );
  if (!event) {
    const current: any = await ChannelOrderEvent.findById(eventId).select("status");
    if (!current) throw new Error("Channel event not found");
    throw new Error(`Cannot ignore an event that is ${current.status}`);
  }
  return event;
}
