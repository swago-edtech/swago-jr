import { google } from "googleapis";
import mongoose from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import ChannelEmailConfig from "../models/ChannelEmailConfig";
import ChannelOrderEvent from "../models/ChannelOrderEvent";
import ChannelApplyLock from "../models/ChannelApplyLock";
import {
  matchChannelProducts,
  deductInventoryForChannelItems,
  restoreInventoryFromChannelSnapshot,
  planChannelDeduction,
  type ChannelMatchedItem,
  ChannelPartialDeductionError,
} from "./channel-inventory";
import {
  type ExtractedOrder,
  type ParsedItem,
  type CountCheck,
  extractTextFromPayload,
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

function orderKeyFor(event: any): string {
  return event.externalOrderId ? String(event.externalOrderId) : `MSG-${event.gmailMessageId}`;
}

/** Product ids that already had stock cut for this marketplace order (locks + older applied rows). */
async function alreadyCutProductIds(event: any): Promise<Set<string>> {
  const cut = new Set<string>();
  const orderKey = orderKeyFor(event);
  const locks = (await ChannelApplyLock.find({ _id: { $regex: `^${escapeRegex(orderKey)}\\|` } })
    .select("productId eventId")
    .lean()) as Array<{ productId?: string; eventId?: unknown }>;
  for (const lock of locks) {
    if (String(lock.eventId || "") !== String(event._id)) cut.add(String(lock.productId || ""));
  }
  if (event.externalOrderId) {
    // Rows applied before per-product locks existed
    const legacy = (await ChannelOrderEvent.find({
      _id: { $ne: event._id },
      externalOrderId: event.externalOrderId,
      eventType: "order",
      status: "applied",
    })
      .select("matchedItems")
      .lean()) as Array<{ matchedItems?: Array<{ productId?: unknown }> }>;
    for (const row of legacy) {
      for (const item of row.matchedItems || []) cut.add(String(item.productId || ""));
    }
  }
  cut.delete("");
  return cut;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function releaseLocks(keys: string[]) {
  if (keys.length) await ChannelApplyLock.deleteMany({ _id: { $in: keys } });
}

const PROCESSING_STALE_MS = 10 * 60 * 1000;

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
 * Cut stock for every matched product of this event, at most once per
 * (marketplace order id + product), even across concurrent runs or duplicate emails.
 */
async function applyMatchedOrder(event: any, reasonId: string) {
  const claimed: any = await claimEventForApply(event._id);
  if (!claimed) {
    // Another run is applying (or already applied) this event
    return ChannelOrderEvent.findById(event._id);
  }

  // Resuming a partly-cut failure: our own locks are expected and the recorded lines are NOT re-cut.
  const resumePartial = claimed.failureKind === "partial";
  const priorCut = resumePartial
    ? (claimed.toObject().inventorySnapshot || []).filter((l: any) => l?.inventoryItemId)
    : [];

  const orderKey = orderKeyFor(claimed);
  const perProduct = new Map<string, ChannelMatchedItem>();
  for (const item of claimed.matchedItems || []) {
    const productId = String(item.productId || "");
    if (!productId) continue;
    const existing = perProduct.get(productId);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    if (existing) {
      existing.quantity += quantity;
    } else {
      perProduct.set(productId, {
        productId,
        productName: item.productName,
        quantity,
        extractedTitle: item.extractedTitle,
        matchType: item.matchType,
      });
    }
  }

  const alreadyCut = await alreadyCutProductIds(claimed);
  const toApply: ChannelMatchedItem[] = [];
  const skipped: string[] = [];
  const interrupted: string[] = [];
  const acquired: string[] = [];
  const newlyAcquired: string[] = [];
  let deductStarted = false;

  try {
    for (const [productId, item] of perProduct) {
      if (alreadyCut.has(productId)) {
        skipped.push(item.productName || productId);
        continue;
      }
      const key = `${orderKey}|${productId}`;
      try {
        await ChannelApplyLock.create({
          _id: key,
          externalOrderId: claimed.externalOrderId || "",
          productId,
          eventId: claimed._id,
          quantity: item.quantity,
        });
        acquired.push(key);
        newlyAcquired.push(key);
        toApply.push(item);
      } catch (error: any) {
        if (error?.code === 11000) {
          const holder = (await ChannelApplyLock.findById(key).select("eventId").lean()) as {
            eventId?: unknown;
          } | null;
          const ours = holder && String(holder.eventId || "") === String(claimed._id);
          if (ours && resumePartial) {
            acquired.push(key);
            toApply.push(item);
          } else if (ours) {
            // Our own lock from an earlier attempt that crashed mid-apply: stock may already be cut.
            interrupted.push(item.productName || productId);
          } else {
            skipped.push(item.productName || productId);
          }
          continue;
        }
        throw error;
      }
    }

    if (interrupted.length) {
      // Never guess: admin decides (Mark as applied / Release & retry).
      await releaseLocks(newlyAcquired);
      return ChannelOrderEvent.findByIdAndUpdate(
        claimed._id,
        {
          $set: {
            status: "failed",
            failureKind: "interrupted",
            error: `An earlier apply was interrupted; stock may already be cut for: ${interrupted.join(
              ", "
            )}. Check inventory history, then choose "Mark as applied" or "Release & retry".`,
            skippedDuplicates: skipped,
          },
        },
        { new: true }
      );
    }

    if (!toApply.length) {
      return ChannelOrderEvent.findByIdAndUpdate(
        claimed._id,
        {
          $set: {
            status: "skipped",
            failureKind: "",
            error: skipped.length
              ? `Order already applied (stock already cut for: ${skipped.join(", ")})`
              : "No matched products to apply",
            skippedDuplicates: skipped,
          },
        },
        { new: true }
      );
    }

    deductStarted = true;
    const snapshot = await deductInventoryForChannelItems(toApply, reasonId, priorCut);
    return ChannelOrderEvent.findByIdAndUpdate(
      claimed._id,
      {
        $set: {
          status: "applied",
          failureKind: "",
          inventorySnapshot: snapshot,
          appliedKeys: acquired,
          skippedDuplicates: skipped,
          error: skipped.length ? `Skipped (already cut earlier): ${skipped.join(", ")}` : "",
        },
      },
      { new: true }
    );
  } catch (error) {
    if (error instanceof ChannelPartialDeductionError) {
      // Some stock WAS cut: keep the locks, record exactly what was cut; Retry cuts only the rest.
      await ChannelOrderEvent.updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: "failed",
            failureKind: "partial",
            inventorySnapshot: error.partialSnapshot,
            appliedKeys: acquired,
            error: `Stock was only partly cut (${error.message}). Retry cuts only the remaining lines.`,
          },
        }
      );
      throw error;
    }
    if (resumePartial) {
      // Prior cut lines are still recorded and locked; nothing new was cut. Stay retryable.
      await releaseLocks(newlyAcquired);
      await ChannelOrderEvent.updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: "failed",
            failureKind: "partial",
            error: `Retry failed (${error instanceof Error ? error.message : "error"}). Already-cut lines kept; nothing re-cut.`,
          },
        }
      );
      throw error;
    }
    // deduct validates before any write, so nothing was cut: release and let admin fix + Confirm.
    await releaseLocks(acquired);
    await ChannelOrderEvent.updateOne(
      { _id: claimed._id },
      {
        $set: {
          status: deductStarted ? "failed" : "pending_review",
          failureKind: "",
          error: error instanceof Error ? error.message : "Failed to update inventory",
        },
      }
    );
    throw error;
  }
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

  try {
    const locks = (await ChannelApplyLock.find({ eventId: claimed._id })
      .select("_id productId")
      .lean()) as Array<{ _id: string; productId?: string }>;
    const keys = locks.map((l) => String(l._id));

    if (choice === "mark_applied") {
      const lockedProducts = new Set(locks.map((l) => String(l.productId || "")));
      const qty = new Map<string, ChannelMatchedItem>();
      for (const m of claimed.matchedItems || []) {
        const id = String(m.productId || "");
        if (!lockedProducts.has(id)) continue;
        const prev = qty.get(id);
        const q = Math.max(1, Number(m.quantity) || 1);
        if (prev) prev.quantity += q;
        else qty.set(id, { productId: id, productName: m.productName, quantity: q });
      }
      const snapshot = qty.size ? await planChannelDeduction([...qty.values()]) : [];
      return ChannelOrderEvent.findByIdAndUpdate(
        claimed._id,
        {
          $set: {
            status: "applied",
            failureKind: "",
            inventorySnapshot: snapshot,
            appliedKeys: keys,
            error: "Marked as applied by admin (stock was already cut; no inventory change made)",
          },
          $push: { auditLog: audit("mark_applied", by, `locks: ${keys.join(", ")}`) },
        },
        { new: true }
      );
    }

    await releaseLocks(keys);
    return ChannelOrderEvent.findByIdAndUpdate(
      claimed._id,
      {
        $set: {
          status: "pending_review",
          failureKind: "",
          error:
            "Locks released by admin. Check inventory history for this order before you Confirm - Confirm will cut stock.",
        },
        $push: { auditLog: audit("release_retry", by, `released: ${keys.join(", ")}`) },
      },
      { new: true }
    );
  } catch (error) {
    await ChannelOrderEvent.updateOne(
      { _id: claimed._id, status: "processing" },
      { $set: { status: "failed", failureKind: "interrupted" } }
    );
    throw error;
  }
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
async function applyCancellation(event: any, reasonId: string) {
  if (!event.externalOrderId) {
    event.status = "pending_review";
    event.error = "Cancellation email has no marketplace order id";
    await event.save();
    return;
  }

  // An order may have been applied across several events (one per product).
  const originals = await ChannelOrderEvent.find({
    externalOrderId: event.externalOrderId,
    eventType: "order",
    status: "applied",
  }).sort({ createdAt: -1 });

  if (!originals.length) {
    event.status = "pending_review";
    event.error = "No applied channel order found to restore";
    await event.save();
    return;
  }

  const restored: any[] = [];
  for (const original of originals) {
    // Atomic applied -> restored so two cancel mails cannot both restore stock
    const claimed: any = await ChannelOrderEvent.findOneAndUpdate(
      { _id: original._id, status: "applied" },
      { $set: { status: "restored" } },
      { new: true }
    );
    if (!claimed?.inventorySnapshot?.length) continue;
    await restoreInventoryFromChannelSnapshot(claimed.inventorySnapshot, reasonId);
    await releaseLocks((claimed.appliedKeys || []).map(String));
    restored.push(...claimed.inventorySnapshot);
  }

  if (!restored.length) {
    event.status = "skipped";
    event.error = "Stock for this order was already returned";
    await event.save();
    return;
  }

  event.status = "restored";
  event.inventorySnapshot = restored;
  event.error = "";
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

  const query = buildSenderQuery(allowlist, config.lastSyncedAt);
  let listed;
  try {
    listed = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: limit,
    });
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

  const messages = listed.data.messages || [];
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

    const existing = await ChannelOrderEvent.findOne({ gmailMessageId: message.id }).select("_id");
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

    const rawText = extractTextFromPayload(full.data.payload).slice(0, 20000);

    const extracted = await extractOrderFromEmail(subject, rawText, catalogForAi);
    const { matched, unmatched } = await matchChannelProducts(
      extracted.items,
      config.productAliases || []
    );
    const count = checkItemCount(extracted.items, extracted.expectedItemCount);

    let event: any;
    try {
      event = await ChannelOrderEvent.create({
        gmailMessageId: message.id,
        channel: "amazon",
        eventType: extracted.eventType,
        status: "pending_review",
        externalOrderId: extracted.externalOrderId,
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
        ? `CH-${extracted.externalOrderId}`
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
        const cut = await alreadyCutProductIds(event);
        const allCut =
          matched.length > 0 && matched.every((m) => cut.has(String(m.productId)));
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
        if (allCut && !unmatched.length) {
          event.status = "skipped";
          event.error = "Order already applied";
          await event.save();
        } else if (reCancelled) {
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

  config.lastSyncedAt = new Date(Date.now() - 300_000);
  await config.save();

  return { processed, skipped, message: `Processed ${processed} new emails` };
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
        event.externalOrderId = reparsed.externalOrderId;
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

/** Every product id already cut for this order, including this event's own (legacy) cut. */
async function cutProductIdsIncludingOwn(event: any): Promise<Set<string>> {
  const cut = await alreadyCutProductIds(event);
  for (const m of event.matchedItems || []) cut.add(String(m.productId || ""));
  for (const key of event.appliedKeys || []) {
    const pid = String(key).split("|").pop();
    if (pid) cut.add(pid);
  }
  const own = (await ChannelApplyLock.find({ eventId: event._id }).select("productId").lean()) as Array<{
    productId?: string;
  }>;
  for (const l of own) cut.add(String(l.productId || ""));
  cut.delete("");
  return cut;
}

/** Read-only preview: re-parse the saved email and list products that were never cut. No writes. */
export async function recheckChannelEvent(eventId: string) {
  await connectDB();
  const event: any = await ChannelOrderEvent.findById(eventId);
  if (!event) throw new Error("Channel event not found");
  if (event.status !== "applied" || event.eventType === "cancel") {
    throw new Error("Only applied (Stock cut) orders can be re-checked");
  }
  const config = await getOrCreateChannelEmailConfig();
  const catalog = (await Product.find({}).select("_id name slug").lean()) as any[];
  const subject = event.subject || "";
  const body = event.rawText || "";
  const extracted = await extractOrderFromEmail(
    subject,
    body,
    catalog.map((p) => ({ id: String(p._id), name: p.name, slug: p.slug }))
  );
  const expected =
    extracted.expectedItemCount ??
    itemsSoldFromSubject(subject) ??
    (typeof event.extracted?.expectedItemCount === "number" ? event.extracted.expectedItemCount : null);
  const count = checkItemCount(extracted.items || [], expected);
  const { matched, unmatched } = await matchChannelProducts(
    extracted.items || [],
    config?.productAliases || []
  );
  const cut = await cutProductIdsIncludingOwn(event);
  const missing = computeMissingLines(matched, cut);
  const names = new Map<string, string>();
  for (const m of event.matchedItems || []) names.set(String(m.productId), m.productName);
  for (const m of matched) names.set(String(m.productId), m.productName);
  const cutQty = (event.matchedItems || []).reduce((s: number, m: any) => s + (Number(m.quantity) || 1), 0);
  const emailShort = typeof expected === "number" && count.parsedQuantity < expected;
  return {
    expected,
    parsedLines: count.parsedLines,
    parsedQuantity: count.parsedQuantity,
    parseMethod: extracted.parseMethod || "none",
    items: (extracted.items || []).map((i) => ({ title: i.title, quantity: i.quantity, sku: i.sku || "" })),
    alreadyCut: [...cut].map((id) => ({ productId: id, productName: names.get(id) || id })),
    missing,
    unmatched,
    emailMissingProduct: emailShort,
    // how many units the admin may still add by hand (never more than the email says)
    manualAllowance:
      typeof expected === "number"
        ? Math.max(0, expected - cutQty - missing.reduce((s, m) => s + m.quantity, 0))
        : 0,
  };
}

const RECHECK_STALE_MS = 10 * 60 * 1000;

/**
 * Cut only products that were never cut for this applied order. `lines` comes from the preview
 * or from admin picks; every line is re-validated against the server's already-cut set and locks.
 */
export async function cutMissingChannelItems(
  eventId: string,
  lines: Array<{ productId: string; quantity: number }>,
  by = ""
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
  try {
    const expected =
      itemsSoldFromSubject(claimed.subject || "") ??
      (typeof claimed.extracted?.expectedItemCount === "number" ? claimed.extracted.expectedItemCount : null);
    const cutQty = (claimed.matchedItems || []).reduce((s: number, m: any) => s + (Number(m.quantity) || 1), 0);

    const wanted: ChannelMatchedItem[] = [];
    for (const line of lines) {
      const id = String(line?.productId || "");
      if (!mongoose.isValidObjectId(id)) throw new Error("Invalid product");
      const qty = Math.floor(Number(line.quantity) || 0);
      if (qty < 1 || qty > 50) throw new Error("Quantity must be 1-50");
      const product: any = await Product.findById(id).select("_id name").lean();
      if (!product) throw new Error("Product not found");
      wanted.push({ productId: id, productName: product.name, quantity: qty, matchType: "recheck" });
    }
    const cut = await cutProductIdsIncludingOwn(claimed);
    const missing = computeMissingLines(wanted, cut);
    const skipped = wanted.filter((w) => cut.has(w.productId)).map((w) => w.productName);
    if (!missing.length) {
      await unclaim();
      throw new Error(`Already cut for this order: ${skipped.join(", ") || "all products"}. Nothing cut.`);
    }
    const addQty = missing.reduce((s, m) => s + m.quantity, 0);
    if (typeof expected === "number" && cutQty + addQty > expected) {
      throw new Error(`Email says ${expected} item(s); ${cutQty} already cut, so at most ${Math.max(0, expected - cutQty)} more`);
    }

    const orderKey = orderKeyFor(claimed);
    const toApply: ChannelMatchedItem[] = [];
    for (const item of missing) {
      const key = `${orderKey}|${item.productId}`;
      try {
        await ChannelApplyLock.create({
          _id: key,
          externalOrderId: claimed.externalOrderId || "",
          productId: item.productId,
          eventId: claimed._id,
          quantity: item.quantity,
        });
        acquired.push(key);
        toApply.push(item);
      } catch (error: any) {
        if (error?.code === 11000) {
          skipped.push(item.productName);
          continue;
        }
        throw error;
      }
    }
    if (!toApply.length) {
      throw new Error(`Already cut for this order: ${skipped.join(", ")}. Nothing cut.`);
    }

    const reasonId = claimed.externalOrderId ? `CH-${claimed.externalOrderId}` : `CH-MSG-${String(claimed.gmailMessageId).slice(-8)}`;
    let snapshot: ChannelSnapshotLineLike[] = [];
    let partialMsg = "";
    try {
      snapshot = await deductInventoryForChannelItems(toApply, reasonId);
    } catch (error) {
      if (error instanceof ChannelPartialDeductionError) {
        // Some lines were cut: keep locks (never re-cut) and record exactly what was cut.
        snapshot = error.partialSnapshot;
        partialMsg = error.message;
      } else {
        throw error;
      }
    }

    const note = toApply.map((i) => `${i.productName} x${i.quantity}`).join(", ");
    await ChannelOrderEvent.updateOne(
      { _id: claimed._id },
      {
        $push: {
          matchedItems: { $each: toApply },
          inventorySnapshot: { $each: snapshot },
          appliedKeys: { $each: acquired },
          auditLog: audit(
            partialMsg ? "cut_missing_partial" : "cut_missing",
            by,
            partialMsg ? `${note} - PARTLY cut (${partialMsg}); check inventory` : note
          ),
        },
        $set: {
          recheckLockAt: null,
          error: partialMsg
            ? `Missing items only partly cut (${partialMsg}). Locked so they are never re-cut; fix stock manually.`
            : skipped.length
              ? `Skipped (already cut): ${skipped.join(", ")}`
              : claimed.error || "",
        },
      }
    );
    if (partialMsg) throw new Error(`Only partly cut: ${partialMsg}. Check inventory history.`);
    return ChannelOrderEvent.findById(claimed._id);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (!msg.startsWith("Only partly cut")) {
      await releaseLocks(acquired);
      await unclaim();
    }
    throw error;
  }
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
  const updated = await applyMatchedOrder(event, reasonId);
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
