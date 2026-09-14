import { google } from "googleapis";
import mongoose from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import ChannelEmailConfig from "../models/ChannelEmailConfig";
import ChannelOrderEvent from "../models/ChannelOrderEvent";
import {
  matchChannelProducts,
  isHighConfidenceMatch,
  deductInventoryForChannelItems,
  restoreInventoryFromChannelSnapshot,
} from "./channel-inventory";

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
  await config.save();
  return sanitizeChannelConfig(config);
}

export async function disconnectGmail() {
  await connectDB();
  const config = await getOrCreateChannelEmailConfig();
  config.refreshToken = "";
  config.connectedEmail = "";
  config.isEnabled = false;
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

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function extractTextFromPayload(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts?.length) {
    const plain = payload.parts.find((part: any) => part.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((part: any) => part.mimeType === "text/html");
    if (html?.body?.data) {
      return decodeBase64Url(html.body.data).replace(/<[^>]+>/g, " ");
    }
    return payload.parts.map((part: any) => extractTextFromPayload(part)).join("\n");
  }
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data).replace(/<[^>]+>/g, " ");
  }
  return "";
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
  const timeClause = lastSyncedAt
    ? `after:${Math.floor(lastSyncedAt.getTime() / 1000)}`
    : "newer_than:3d";
  const cleaned = senders.map((s) => s.trim()).filter(Boolean);
  if (!cleaned.length) return timeClause;
  const clause = cleaned.map((sender) => `from:${sender}`).join(" OR ");
  return `{${clause}} ${timeClause}`;
}

type ExtractedOrder = {
  eventType: "order" | "cancel" | "unknown";
  externalOrderId: string;
  confidence: number;
  reasoning: string;
  items: Array<{ title: string; quantity: number; sku?: string }>;
};

function buildExtractionPrompt(
  subject: string,
  body: string,
  catalog: Array<{ id: string; name: string; slug?: string }>
) {
  const catalogPreview = catalog
    .slice(0, 40)
    .map((p) => `${p.id} | ${p.name}${p.slug ? ` | ${p.slug}` : ""}`)
    .join("\n");

  const system =
    "Extract marketplace order details from seller/customer emails. Return only JSON.";
  const user = `Extract whether this email is a new paid/confirmed order or a cancellation/refund.
Return JSON:
{
  "eventType": "order" | "cancel" | "unknown",
  "externalOrderId": "Amazon/marketplace order id or empty",
  "confidence": 0.0-1.0,
  "reasoning": "short",
  "items": [{ "title": "product title as in email", "quantity": 1, "sku": "" }]
}

Ignore shipping-only updates with no line items unless they clearly cancel an order.
Prefer titles that can match this Swago catalog:
${catalogPreview || "(empty catalog)"}

Subject: ${subject}

Email:
${body.slice(0, 12000)}`;

  return { system, user };
}

function parseExtractedOrder(content: string, fallback: ExtractedOrder): ExtractedOrder {
  try {
    const cleaned = String(content || "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const eventType =
      parsed.eventType === "order" || parsed.eventType === "cancel"
        ? parsed.eventType
        : "unknown";
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((item: any) => ({
            title: String(item.title || "").trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
            sku: String(item.sku || "").trim(),
          }))
          .filter((item: { title: string }) => item.title)
      : [];

    return {
      eventType,
      externalOrderId: String(parsed.externalOrderId || "").trim(),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reasoning: String(parsed.reasoning || ""),
      items,
    };
  } catch {
    return fallback;
  }
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
  };

  if (!process.env.GEMINI_API_KEY) {
    return {
      ...fallback,
      reasoning: "Configure GEMINI_API_KEY for email extraction",
    };
  }

  const { system, user } = buildExtractionPrompt(subject, body, catalog);

  try {
    const content = await extractWithGemini(system, user);
    if (!content) return fallback;
    return parseExtractedOrder(content, fallback);
  } catch (geminiErr) {
    console.error(
      "⚠️ Gemini extraction failed:",
      geminiErr instanceof Error ? geminiErr.message : geminiErr
    );
    return {
      ...fallback,
      reasoning: geminiErr instanceof Error ? geminiErr.message : "Gemini extraction failed",
    };
  }
}

async function hasAppliedOrderForExternalId(externalOrderId: string): Promise<boolean> {
  if (!externalOrderId) return false;
  const existing = await ChannelOrderEvent.findOne({
    externalOrderId,
    eventType: "order",
    status: "applied",
  }).select("_id");
  return Boolean(existing);
}

async function applyMatchedOrder(event: any, reasonId: string) {
  if (event.externalOrderId && (await hasAppliedOrderForExternalId(event.externalOrderId))) {
    event.status = "skipped";
    event.error = "Order already applied";
    await event.save();
    return;
  }

  const items = (event.matchedItems || []).map((item: any) => ({
    productId: item.productId?.toString(),
    productName: item.productName,
    quantity: item.quantity,
    extractedTitle: item.extractedTitle,
    matchType: item.matchType,
  }));
  const snapshot = await deductInventoryForChannelItems(items, reasonId);
  event.inventorySnapshot = snapshot;
  event.status = "applied";
  event.error = "";
  await event.save();
}

async function applyCancellation(event: any, reasonId: string) {
  if (!event.externalOrderId) {
    event.status = "pending_review";
    event.error = "Cancellation email has no marketplace order id";
    await event.save();
    return;
  }

  const original = await ChannelOrderEvent.findOne({
    externalOrderId: event.externalOrderId,
    eventType: "order",
    status: "applied",
  }).sort({ createdAt: -1 });

  if (!original?.inventorySnapshot?.length) {
    event.status = "pending_review";
    event.error = "No applied channel order found to restore";
    await event.save();
    return;
  }

  await restoreInventoryFromChannelSnapshot(original.inventorySnapshot, reasonId);
  original.status = "restored";
  await original.save();
  event.status = "restored";
  event.inventorySnapshot = original.inventorySnapshot;
  event.error = "";
  await event.save();
}

export async function runChannelEmailSync(limit = 25) {
  await connectDB();
  const config = await getOrCreateChannelEmailConfig();

  if (!config.isEnabled) {
    return { processed: 0, skipped: 0, message: "Channel email sync is disabled" };
  }
  if (!config.refreshToken) {
    return { processed: 0, skipped: 0, message: "Gmail is not connected" };
  }

  const oauth = getGoogleOAuthClient(process.env.GOOGLE_REDIRECT_URI);
  oauth.setCredentials({ refresh_token: config.refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth });

  const allowlist = config.senderAllowlist || [];
  const query = buildSenderQuery(allowlist, config.lastSyncedAt);
  const listed = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: limit,
  });

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

    const existing = await ChannelOrderEvent.findOne({ gmailMessageId: message.id });
    if (existing) {
      skipped += 1;
      continue;
    }

    const full = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "full",
    });

    const headers = (full.data.payload?.headers || []) as GmailHeader[];
    const subject = headerValue(headers, "Subject");
    const fromEmail = headerValue(headers, "From");
    const receivedAt = full.data.internalDate
      ? new Date(Number(full.data.internalDate))
      : new Date();

    if (!isAllowedSender(fromEmail, allowlist)) {
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
      skipped += 1;
      continue;
    }

    const rawText = extractTextFromPayload(full.data.payload).slice(0, 20000);

    const extracted = await extractOrderFromEmail(subject, rawText, catalogForAi);
    const { matched, unmatched } = await matchChannelProducts(
      extracted.items,
      config.productAliases || []
    );

    const event = await ChannelOrderEvent.create({
      gmailMessageId: message.id,
      channel: "amazon",
      eventType: extracted.eventType,
      status: "pending_review",
      externalOrderId: extracted.externalOrderId,
      fromEmail,
      subject,
      receivedAt,
      rawText,
      extracted: {
        confidence: extracted.confidence,
        reasoning: extracted.reasoning,
        items: extracted.items,
      },
      matchedItems: matched,
    });

    try {
      const reasonId = extracted.externalOrderId
        ? `CH-${extracted.externalOrderId}`
        : `CH-MSG-${message.id.slice(-8)}`;

      if (extracted.eventType === "unknown" || !extracted.items.length) {
        event.status = extracted.eventType === "unknown" ? "skipped" : "pending_review";
        event.error = unmatched.join("; ") || extracted.reasoning;
        await event.save();
      } else if (extracted.eventType === "cancel") {
        await applyCancellation(event, reasonId);
      } else if (
        extracted.externalOrderId &&
        (await hasAppliedOrderForExternalId(extracted.externalOrderId))
      ) {
        event.status = "skipped";
        event.error = "Order already applied";
        await event.save();
      } else if (!extracted.externalOrderId) {
        event.status = "pending_review";
        event.error = "No marketplace order id — review before applying inventory";
        await event.save();
      } else if (isHighConfidenceMatch(matched, unmatched, extracted.confidence)) {
        await applyMatchedOrder(event, reasonId);
      } else {
        event.status = "pending_review";
        event.error = unmatched.length
          ? `Unmatched products: ${unmatched.join(", ")}`
          : "Low confidence match — review required";
        await event.save();
      }
    } catch (error) {
      event.status = "failed";
      event.error = error instanceof Error ? error.message : "Failed to update inventory";
      await event.save();
    }

    processed += 1;
  }

  config.lastSyncedAt = new Date(Date.now() - 300_000);
  await config.save();

  return { processed, skipped, message: `Processed ${processed} new emails` };
}

export async function applyChannelEvent(eventId: string) {
  await connectDB();
  const event = await ChannelOrderEvent.findById(eventId);
  if (!event) throw new Error("Channel event not found");
  if (event.status === "applied" || event.status === "restored" || event.status === "ignored") {
    return event;
  }

  const reasonId = event.externalOrderId
    ? `CH-${event.externalOrderId}`
    : `CH-MSG-${event.gmailMessageId.slice(-8)}`;

  if (event.eventType === "cancel") {
    await applyCancellation(event, reasonId);
    return event;
  }

  if (!event.matchedItems?.length) {
    throw new Error("No matched products to apply");
  }

  if (event.externalOrderId && (await hasAppliedOrderForExternalId(event.externalOrderId))) {
    event.status = "skipped";
    event.error = "Order already applied";
    await event.save();
    return event;
  }

  await applyMatchedOrder(event, reasonId);
  return event;
}

export async function ignoreChannelEvent(eventId: string) {
  await connectDB();
  const event = await ChannelOrderEvent.findByIdAndUpdate(
    eventId,
    { $set: { status: "ignored", error: "" } },
    { new: true }
  );
  if (!event) throw new Error("Channel event not found");
  return event;
}
