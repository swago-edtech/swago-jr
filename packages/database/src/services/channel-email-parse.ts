/**
 * Pure (DB-free) parsing helpers for marketplace channel emails.
 * Kept separate so they can be unit-tested without Mongo/Gmail.
 */

export type ParsedItem = {
  title: string;
  quantity: number;
  sku?: string;
  price?: string;
};

export type ParseMethod = "regex" | "subject" | "ai" | "none";

export type ExtractedOrder = {
  eventType: "order" | "cancel" | "unknown";
  externalOrderId: string;
  confidence: number;
  reasoning: string;
  items: ParsedItem[];
  parseMethod?: ParseMethod;
  expectedItemCount?: number | null;
  shipBy?: string;
  orderDate?: string;
};

const AMAZON_ORDER_ID = /\b(\d{3}-\d{7}-\d{7})\b/;
/** Marketplace seller SKUs like SWG-OBG-SSR-01-6Y or GAG-SDC-01-6Y (case-sensitive, uppercase). */
const SKU_HINT = /\b([A-Z]{2,6}(?:-[A-Z0-9]{1,10}){2,})\b/g;

function decodeBase64Url(data: string): string {
  const padded = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** Convert HTML mail into line-oriented text so label/value pairs stay readable. */
export function htmlToText(html: string): string {
  const text = String(html || "")
    .replace(/<(script|style|head)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|table|section)>/gi, "\n")
    .replace(/<\/(td|th)>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function collectParts(payload: any, mimeType: string, out: string[]) {
  if (!payload) return;
  if (payload.mimeType === mimeType && payload.body?.data) {
    out.push(decodeBase64Url(payload.body.data));
  }
  for (const part of payload.parts || []) collectParts(part, mimeType, out);
}

/** Walk the whole MIME tree (nested multipart/alternative too). Prefer text/plain, else HTML. */
export function extractTextFromPayload(payload: any): string {
  if (!payload) return "";
  const plain: string[] = [];
  collectParts(payload, "text/plain", plain);
  const plainText = plain.join("\n").trim();
  if (plainText) return plainText;

  const html: string[] = [];
  collectParts(payload, "text/html", html);
  if (html.length) return htmlToText(html.join("\n"));

  if (payload.body?.data) return htmlToText(decodeBase64Url(payload.body.data));
  return "";
}

export function normalizeLoose(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function findSkuHints(text: string): string[] {
  const found = String(text || "").match(SKU_HINT) || [];
  return [...new Set(found.map((s) => s.toUpperCase()))];
}

/**
 * Fill a missing SKU only when it is unambiguous: a single item with a single SKU hint,
 * or a hint that literally appears in that item's title. Never assign by position.
 */
export function enrichItemsWithSkuHints(
  subject: string,
  body: string,
  items: ParsedItem[]
): ParsedItem[] {
  const hints = findSkuHints(`${subject}\n${body}`);
  if (!hints.length) return items;
  return items.map((item) => {
    if (item.sku) return item;
    const titleNorm = normalizeLoose(item.title);
    const near = hints.filter((sku) => titleNorm.includes(normalizeLoose(sku)));
    const sku =
      near.length === 1
        ? near[0]
        : items.length === 1 && hints.length === 1
          ? hints[0]
          : undefined;
    return sku ? { ...item, sku } : item;
  });
}

const LABEL_STOP =
  /\s*(?:\b(?:Item|Condition|SKU|ASIN|Quantity|Qty|Price|Item price|Tax|Shipping|Order\s*(?:ID|date)|Ship\s*by|Dispatch\s*by|Deliver\s*by|Delivery\s*by|Listing ID)\b\s*:|\n|$)/i;

function valueAfter(text: string, label: RegExp): string {
  const m = text.match(label);
  if (!m || m.index === undefined) return "";
  const rest = text.slice(m.index + m[0].length);
  const stop = rest.search(LABEL_STOP);
  return (stop >= 0 ? rest.slice(0, stop) : rest).replace(/\s+/g, " ").trim().slice(0, 200);
}

function parseBlock(segment: string, titleFromStart: boolean): ParsedItem | null {
  const skuMatch = segment.match(/\bSKU\s*:\s*([A-Za-z0-9][A-Za-z0-9._\-\/]*)/i);
  const qtyMatch = segment.match(/\b(?:Quantity|Qty)\s*:\s*(\d+)/i);
  const priceMatch = segment.match(
    /\b(?:Item\s+)?Price\s*:\s*((?:INR|Rs\.?|\u20b9)?\s*[\d,]+(?:\.\d{1,2})?)/i
  );
  let title = "";
  if (titleFromStart) {
    const stop = segment.search(LABEL_STOP);
    title = (stop >= 0 ? segment.slice(0, stop) : segment).replace(/\s+/g, " ").trim();
  }
  const sku = skuMatch ? skuMatch[1].trim().toUpperCase() : "";
  if (!title && !sku) return null;
  return {
    title: title || sku,
    quantity: qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10) || 1) : 1,
    sku: sku || undefined,
    price: priceMatch ? priceMatch[1].replace(/\s+/g, " ").trim() : undefined,
  };
}

/**
 * Parse every item block in an Amazon seller notification body.
 * Each item keeps its OWN SKU / qty / price (read from its own block).
 */
export function parseAmazonOrderItems(body: string): ParsedItem[] {
  const text = String(body || "");
  const items: ParsedItem[] = [];

  const itemMarker = /\b(?:Item|Product)(?:\s+name)?\s*:\s*/gi;
  const starts: Array<{ index: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = itemMarker.exec(text)) !== null) {
    starts.push({ index: m.index, end: m.index + m[0].length });
  }

  if (starts.length) {
    for (let i = 0; i < starts.length; i += 1) {
      const segEnd =
        i + 1 < starts.length ? starts[i + 1].index : Math.min(text.length, starts[i].end + 2000);
      const parsed = parseBlock(text.slice(starts[i].end, segEnd), true);
      if (parsed) items.push(parsed);
    }
    if (items.length) return items;
  }

  // No "Item:" labels: split on every SKU label instead (one block per SKU).
  const skuMarker = /\bSKU\s*:/gi;
  const skuStarts: number[] = [];
  while ((m = skuMarker.exec(text)) !== null) skuStarts.push(m.index);
  for (let i = 0; i < skuStarts.length; i += 1) {
    const segEnd =
      i + 1 < skuStarts.length ? skuStarts[i + 1] : Math.min(text.length, skuStarts[i] + 1000);
    const parsed = parseBlock(text.slice(skuStarts[i], segEnd), false);
    if (parsed) items.push(parsed);
  }
  return items;
}

export function extractOrderId(subject: string, body: string): string {
  const labelled = String(body || "").match(
    /Order\s*(?:ID|#|Number)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-]{4,})/i
  );
  if (labelled) return labelled[1].trim();
  const any = `${body}\n${subject}`.match(AMAZON_ORDER_ID);
  return any ? any[1] : "";
}

/** "Sold, ship now: 2 items sold" / "You have sold 2 items" -> 2 */
export function extractExpectedItemCount(subject: string, body: string): number | null {
  const s = String(subject || "").match(/\b(\d{1,3})\s+items?\s+(?:sold|ordered)\b/i);
  if (s) return parseInt(s[1], 10);
  const b =
    String(body || "").match(/\b(?:sold|ordered)\s+(\d{1,3})\s+items?\b/i) ||
    String(body || "").match(/\b(\d{1,3})\s+items?\s+(?:sold|ordered)\b/i);
  return b ? parseInt(b[1], 10) : null;
}

export function extractShipBy(body: string): string {
  return valueAfter(
    String(body || ""),
    /\b(?:Ship\s*by|Dispatch\s*by|Ship\s*before|Shipping\s*deadline)\s*:?\s*/i
  );
}

export function extractOrderDate(body: string): string {
  return valueAfter(String(body || ""), /\bOrder\s*date\s*:?\s*/i);
}

/** Standard Amazon seller notification body. Null when the known format isn't present. */
export function parseAmazonOrderFormat(body: string, subject = ""): ExtractedOrder | null {
  const items = parseAmazonOrderItems(body);
  if (!items.length) return null;
  const externalOrderId = extractOrderId(subject, body);
  if (!externalOrderId) return null;
  return {
    eventType: "order",
    externalOrderId,
    confidence: 0.95,
    reasoning: `Local Amazon parser read ${items.length} item block(s)`,
    items,
    parseMethod: "regex",
  };
}

/** Single-item subject: "Sold, ship now: SWG-OBG-SSR-01-6Y Swago Seek Rush ... 403-2649531-3257906" */
export function parseSoldShipNowSubject(subject: string): ExtractedOrder | null {
  const cleaned = String(subject || "").replace(/^\[[^\]]*\]\s*/g, "").trim();
  const match = cleaned.match(
    /sold,?\s*ship now:\s*([A-Z]{2,6}(?:-[A-Z0-9]{1,10}){2,})\s+(.+?)\s+(\d{3}-\d{7}-\d{7})\b/i
  );
  if (!match) return null;
  return {
    eventType: "order",
    externalOrderId: match[3],
    confidence: 0.9,
    reasoning: "Parsed sold/ship-now subject",
    items: [
      { title: match[2].replace(/\s+/g, " ").trim(), quantity: 1, sku: match[1].toUpperCase() },
    ],
    parseMethod: "subject",
    expectedItemCount: 1,
  };
}

export type CountCheck = {
  expected: number | null;
  parsedLines: number;
  parsedQuantity: number;
  ok: boolean;
  note: string;
};

/** Expected vs parsed. OK when expected unknown, or line count OR total units equal expected. */
export function checkItemCount(
  items: ParsedItem[],
  expected: number | null | undefined
): CountCheck {
  const parsedLines = items.length;
  const parsedQuantity = items.reduce((sum, i) => sum + Math.max(1, Number(i.quantity) || 1), 0);
  const exp = typeof expected === "number" && expected > 0 ? expected : null;
  const ok = exp === null || parsedLines === exp || parsedQuantity === exp;
  return {
    expected: exp,
    parsedLines,
    parsedQuantity,
    ok,
    note: ok ? "" : `Expected ${exp} item${exp === 1 ? "" : "s"}, parsed ${parsedQuantity}`,
  };
}

export function buildExtractionPrompt(
  subject: string,
  body: string,
  catalog: Array<{ id: string; name: string; slug?: string }>,
  expectedItemCount?: number | null
) {
  const catalogPreview = catalog
    .slice(0, 40)
    .map((p) => `${p.id} | ${p.name}${p.slug ? ` | ${p.slug}` : ""}`)
    .join("\n");

  const system = "Extract marketplace order details from seller/customer emails. Return only JSON.";
  const user = `Classify this Amazon/marketplace seller email.
Use eventType "order" ONLY for a NEW paid/confirmed order (order confirmation / sold notification) with line items.
Use eventType "cancel" ONLY for a clear cancellation or refund of an existing order.
Use eventType "unknown" for shipping, dispatch, delivery, tracking, payment reminders, marketing, or anything that is not a new order or cancel.

Return JSON:
{
  "eventType": "order" | "cancel" | "unknown",
  "externalOrderId": "Amazon/marketplace order id or empty",
  "confidence": 0.0-1.0,
  "reasoning": "short",
  "shipBy": "ship-by / dispatch-by date text or empty",
  "items": [{ "title": "product title as in email", "quantity": 1, "sku": "seller SKU (e.g. SWG-XXX-XXX-01-6Y) or empty", "price": "price text or empty" }]
}

CRITICAL:
- The email may contain SEVERAL items. Return EVERY line item as its own entry, never only the first.
- Take each item's SKU, quantity and price from THAT item's own block. Do not copy one SKU onto another item.
${expectedItemCount ? `- The subject says ${expectedItemCount} item(s) were sold; the items array must account for all of them.\n` : ""}
Prefer titles that can match this Swago catalog:
${catalogPreview || "(empty catalog)"}

Subject: ${subject}

Email:
${body.slice(0, 12000)}`;

  return { system, user };
}

export function parseExtractedOrder(content: string, fallback: ExtractedOrder): ExtractedOrder {
  try {
    const cleaned = String(content || "")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const eventType =
      parsed.eventType === "order" || parsed.eventType === "cancel" ? parsed.eventType : "unknown";
    const items: ParsedItem[] = Array.isArray(parsed.items)
      ? parsed.items
          .map((item: any) => ({
            title: String(item.title || "").trim(),
            quantity: Math.max(1, Number(item.quantity) || 1),
            sku: String(item.sku || "").trim().toUpperCase() || undefined,
            price: String(item.price || "").trim() || undefined,
          }))
          .filter((item: ParsedItem) => item.title || item.sku)
          .map((item: ParsedItem) => ({ ...item, title: item.title || item.sku || "" }))
      : [];

    return {
      eventType,
      externalOrderId: String(parsed.externalOrderId || "").trim(),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      reasoning: String(parsed.reasoning || ""),
      items,
      parseMethod: "ai",
      shipBy: String(parsed.shipBy || "").trim() || undefined,
    };
  } catch {
    return fallback;
  }
}