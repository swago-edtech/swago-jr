/**
 * Synthetic multi-item Amazon "sold, ship now" email test (no DB, no network).
 * Run: npx tsx packages/database/scripts/test-channel-email-parse.ts
 */
import assert from "node:assert/strict";
import {
  parseAmazonOrderFormat,
  parseSoldShipNowSubject,
  htmlToText,
  extractTextFromPayload,
  checkItemCount,
  extractExpectedItemCount,
  buildExtractionPrompt,
} from "../src/services/channel-email-parse";
import { remainingAfterCut, mergeSnapshotLines } from "../src/services/channel-inventory";
import { withManualMatch, computeMissingLines, needsItemRecheck, itemsSoldFromSubject } from "../src/services/channel-email-sync";

const subject = "Sold, ship now: 2 items sold - Order 408-1234567-1234567";
const body = `
Congratulations, you have a new order.
Order ID: 408-1234567-1234567
Order date: 28 Oct 2026
Please ship this order using Easy Ship by: 30 Oct 2026

Item: Swago Seek Rush Board Game (6Y+)
SKU: SWG-OBG-SSR-01-6Y
Quantity: 1
Price: INR 899.00

Item: Swago Word Builder Card Game
SKU: SWG-CRD-WB-02-8Y
Quantity: 2
Price: INR 499.00
`;

let pass = 0;
function t(name: string, fn: () => void) {
  fn();
  pass++;
  console.log("PASS", name);
}

t("expected count from subject", () => {
  assert.equal(extractExpectedItemCount(subject, body), 2);
});

const parsed = parseAmazonOrderFormat(body, subject);
t("parses BOTH item blocks with per-item SKU/qty/price", () => {
  assert.ok(parsed, "parser returned null");
  assert.equal(parsed!.externalOrderId, "408-1234567-1234567");
  assert.equal(parsed!.items.length, 2);
  assert.deepEqual(
    parsed!.items.map((i) => [i.sku, i.quantity]),
    [
      ["SWG-OBG-SSR-01-6Y", 1],
      ["SWG-CRD-WB-02-8Y", 2],
    ]
  );
  assert.match(parsed!.items[0].title, /Seek Rush/);
  assert.match(String(parsed!.items[1].price), /499/);
  assert.equal(parsed!.parseMethod, "regex");
});

t("count check OK when 2 expected and 2 parsed", () => {
  const c = checkItemCount(parsed!.items, 2);
  assert.equal(c.ok, true);
});

t("mismatch (2 expected, 1 parsed) -> needs-confirm note", () => {
  const c = checkItemCount([parsed!.items[0]], 2);
  assert.equal(c.ok, false);
  assert.match(c.note || "", /Expected 2 items, parsed 1/);
});

t("single-block truncated email detected as mismatch", () => {
  const truncated = body.split("Item: Swago Word Builder")[0];
  const p = parseAmazonOrderFormat(truncated, subject);
  assert.equal(p?.items.length, 1);
  assert.equal(checkItemCount(p!.items, extractExpectedItemCount(subject, truncated)).ok, false);
});

t("Gemini fallback prompt asks for every item + expected count", () => {
  const prompt = buildExtractionPrompt(subject, body, [], 2).user;
  assert.match(prompt, /EVERY line item/);
  assert.match(prompt, /2 item\(s\)/);
});

t("HTML-only email (table layout) parses both items", () => {
  const html = `<html><head><style>td{}</style></head><body><table>
    <tr><td>Order ID:</td><td>408-7654321-7654321</td></tr>
    <tr><td>Item:</td><td>Swago Seek Rush Board Game</td></tr>
    <tr><td>SKU:</td><td>SWG-OBG-SSR-01-6Y</td></tr>
    <tr><td>Quantity:</td><td>1</td></tr>
    <tr><td>Item:</td><td>Swago Word Builder &amp; Friends</td></tr>
    <tr><td>SKU:</td><td>SWG-CRD-WB-02-8Y</td></tr>
    <tr><td>Quantity:</td><td>3</td></tr></table></body></html>`;
  const payload = {
    mimeType: "multipart/alternative",
    parts: [{ mimeType: "text/html", body: { data: Buffer.from(html).toString("base64url") } }],
  };
  const text = extractTextFromPayload(payload);
  assert.equal(text, htmlToText(html));
  const p = parseAmazonOrderFormat(text, "Sold, ship now: 2 items sold");
  assert.equal(p?.externalOrderId, "408-7654321-7654321");
  assert.deepEqual(p!.items.map((i) => [i.sku, i.quantity]), [["SWG-OBG-SSR-01-6Y", 1], ["SWG-CRD-WB-02-8Y", 3]]);
  assert.match(p!.items[1].title, /Word Builder & Friends/);
  assert.ok(checkItemCount(p!.items, 2).ok);
});

t("regression: single-item subject-only email still parses (count 1, OK)", () => {
  const s = "Sold, ship now: SWG-OBG-SSR-01-6Y Swago Seek Rush Board Game 403-2649531-3257906";
  assert.equal(parseAmazonOrderFormat("", s), null);
  const p = parseSoldShipNowSubject(s);
  assert.equal(p?.externalOrderId, "403-2649531-3257906");
  assert.equal(p?.items.length, 1);
  assert.equal(p?.items[0].sku, "SWG-OBG-SSR-01-6Y");
  assert.ok(checkItemCount(p!.items, p!.expectedItemCount).ok);
});

t("one line with qty 2 satisfies '2 items sold'", () => {
  assert.ok(checkItemCount([{ title: "X", quantity: 2 }], 2).ok);
});

t("no expected count (non-standard mail) never blocks", () => {
  assert.ok(checkItemCount([{ title: "X", quantity: 1 }], null).ok);
  assert.equal(extractExpectedItemCount("Your shipment is on its way", "Track your package"), null);
});

t("partial retry: only un-cut lines remain, never re-cut", () => {
  const totals = new Map([
    ["a", { quantity: 3, name: "Board" }],
    ["b", { quantity: 2, name: "Box" }],
  ]);
  const rest = remainingAfterCut(totals, [{ inventoryItemId: "a", quantity: 3 }]);
  assert.deepEqual([...rest.keys()], ["b"]);
  assert.equal(rest.get("b")!.quantity, 2);
  assert.equal(remainingAfterCut(totals, [{ inventoryItemId: "a", quantity: 3 }, { inventoryItemId: "b", quantity: 2 }]).size, 0);
  assert.equal(remainingAfterCut(totals, []).size, 2);
});

t("snapshot merge keeps prior cut lines + new ones", () => {
  const m = mergeSnapshotLines(
    [{ inventoryItemId: "a" as any, inventoryItemName: "Board", quantity: 3 }],
    [{ inventoryItemId: "b" as any, inventoryItemName: "Box", quantity: 2 }]
  );
  assert.deepEqual(m.map((l) => [String(l.inventoryItemId), l.quantity]), [["a", 3], ["b", 2]]);
});

t("manual product pick replaces only that line and clears unmatched", () => {
  const items = [{ title: "Game A", quantity: 2 }, { title: "Game B", quantity: 1 }];
  const r = withManualMatch(items, [{ productId: "p1", productName: "A", quantity: 2, extractedTitle: "Game A" }], 1, {
    productId: "p2",
    productName: "B",
  });
  assert.equal(r.matched.length, 2);
  assert.deepEqual(r.unmatched, []);
  assert.equal(r.matched.find((m) => m.extractedTitle === "Game B")!.matchType, "manual");
  const r2 = withManualMatch(items, r.matched, 0, { productId: "p3", productName: "C" });
  assert.equal(r2.matched.find((m) => m.extractedTitle === "Game A")!.productId, "p3");
  assert.equal(r2.matched.length, 2);
  assert.throws(() => withManualMatch(items, [], 5, { productId: "x", productName: "x" }));
});

t("re-check: legacy event with 1 cut + 2 parsed -> 1 missing", () => {
  const parsed = [
    { productId: "pA", productName: "Seek Rush", quantity: 1 },
    { productId: "pB", productName: "Word Builder", quantity: 3 },
  ];
  const missing = computeMissingLines(parsed, new Set(["pA"]));
  assert.deepEqual(missing.map((m) => [m.productId, m.quantity]), [["pB", 3]]);
});

t("re-check: already complete -> 0 missing", () => {
  const parsed = [
    { productId: "pA", productName: "A", quantity: 1 },
    { productId: "pB", productName: "B", quantity: 1 },
  ];
  assert.equal(computeMissingLines(parsed, new Set(["pA", "pB"])).length, 0);
});

t("re-check: lock from another event counts as cut; duplicates merge; never re-cut on bigger qty", () => {
  const parsed = [
    { productId: "pA", productName: "A", quantity: 5 },
    { productId: "pC", productName: "C", quantity: 1 },
    { productId: "pC", productName: "C", quantity: 1 },
    { productId: "pL", productName: "Locked", quantity: 1 },
  ];
  const missing = computeMissingLines(parsed, new Set(["pA", "pL"]));
  assert.deepEqual(missing.map((m) => [m.productId, m.quantity]), [["pC", 2]]);
});

t("re-check button shows only for applied N>1 orders", () => {
  assert.equal(itemsSoldFromSubject("Sold, ship now: 3 items sold"), 3);
  assert.ok(needsItemRecheck({ status: "applied", eventType: "order", subject: "Sold, ship now: 2 items sold", extracted: {} }));
  assert.ok(needsItemRecheck({ status: "applied", eventType: "order", subject: "x", extracted: { expectedItemCount: 2, parsedItemCount: 1 } }));
  assert.ok(!needsItemRecheck({ status: "applied", eventType: "order", subject: "Sold, ship now: SKU 403-1-2", extracted: {} }));
  assert.ok(!needsItemRecheck({ status: "pending_review", eventType: "order", subject: "2 items sold" }));
  assert.ok(!needsItemRecheck({ status: "applied", eventType: "cancel", subject: "2 items sold" }));
});

console.log(`\n${pass} tests passed`);