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
import { reconcileOrder, netCutByComponent, skuEquals } from "../src/services/channel-reconcile";
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

// ---------------------------------------------------------------------------
// Real "Sold, ship now: 2 items sold" email (order 408-5251000-7343559)
// ---------------------------------------------------------------------------
const realBody = `Order Details
Order ID: 408-5251000-7343559
Order date: 28/10/2026
Please ship this order using: Standard Shipping
Collect on Delivery prepaid: INR 0.00
Collect on Delivery amount: INR 1888.84

Ship by: 30/10/2026
Item: Swago Seek Rush - Fast-Paced Spot-It Board Game for Kids, Teens & Adults | Educational Brain Training Game for Focus & Memory | Ages 6+ | Family, Party & Game Night| 2-4 Players| Gift for Boys & Girls
Condition: New
SKU: SWG-OBG-SSR-01-6Y
Quantity: 1
Price: INR 895.24
Tax: INR 44.76
Amazon fees: -INR 56.64
Collect on Delivery fees: INR 3.75

Ship by: 30/10/2026
Item: Swago Scarf Dumb Charades - Confidence-Building Acting & Guessing Card Game for Kids & Teens | Family,Party & Game Night Fun | Educational Learning Game | Ages 6+ | 2-12 Players |Gift for Boys & Girls
Condition: New
SKU: SWG-GAG-SDC-01-6Y
Quantity: 1
Price: INR 895.24
Tax: INR 44.76
Amazon fees: -INR 56.64
Collect on Delivery fees: INR 3.75`;
const realSubject = "Sold, ship now: 2 items sold";

function expectReal(body: string, qty: [number, number] = [1, 1]) {
  const r = parseAmazonOrderFormat(body, realSubject);
  assert.ok(r, "parser returned null");
  assert.equal(r!.externalOrderId, "408-5251000-7343559");
  assert.deepEqual(
    r!.items.map((i) => [i.sku, i.quantity]),
    [
      ["SWG-OBG-SSR-01-6Y", qty[0]],
      ["SWG-GAG-SDC-01-6Y", qty[1]],
    ]
  );
  assert.match(r!.items[0].title, /^Swago Seek Rush/);
  assert.match(r!.items[1].title, /^Swago Scarf Dumb Charades/);
  assert.ok(checkItemCount(r!.items, extractExpectedItemCount(realSubject, body)).ok || qty[1] !== 1);
}

t("real 2-item email: both SKUs (with SWG- prefix), qty 1 each", () => expectReal(realBody));
t("real email with CRLF line endings", () => expectReal(realBody.replace(/\n/g, "\r\n")));
t("real email with extra whitespace / tabs / nbsp", () =>
  expectReal(realBody.split("\n").map((l) => `  \t${l.replace(/: /g, ":\u00a0 ")}  `).join("\n"))
);
t("real email as HTML table (htmlToText)", () => {
  const html =
    "<html><body><table>" +
    realBody
      .split("\n")
      .map((l) => {
        const i = l.indexOf(":");
        return i > 0
          ? `<tr><td><b>${l.slice(0, i + 1)}</b></td><td>${l.slice(i + 1).replace(/&/g, "&amp;")}</td></tr>`
          : `<tr><td>&nbsp;</td></tr>`;
      })
      .join("\r\n") +
    "</table></body></html>";
  expectReal(htmlToText(html));
});
t("real email, qty 1 + 2 per SKU", () => {
  const body2 = realBody.replace(/(SWG-GAG-SDC-01-6Y\nQuantity: )1/, "$12");
  expectReal(body2, [1, 2]);
  const r = parseAmazonOrderFormat(body2, "Sold, ship now: 3 items sold")!;
  assert.ok(checkItemCount(r.items, 3).ok);
});
t("SKU compare: exact, trimmed, case-insensitive, no prefix guessing", () => {
  assert.ok(skuEquals(" swg-gag-sdc-01-6y ", "SWG-GAG-SDC-01-6Y"));
  assert.ok(!skuEquals("GAG-SDC-01-6Y", "SWG-GAG-SDC-01-6Y"));
  assert.ok(!skuEquals("", ""));
});

const bomA = [{ inventoryItemId: "iA", quantity: 1 }];
const bomB = [{ inventoryItemId: "iB", quantity: 1 }];
const wantAB = [
  { productId: "pA", productName: "Seek Rush", quantity: 1 },
  { productId: "pB", productName: "Dumb Charades", quantity: 1 },
];
t("reconcile: old order where only Seek Rush was cut -> Charades x1 missing", () => {
  const net = netCutByComponent([{ inventoryItemId: "iA", type: "deduction", quantity: 1 }]);
  const { lines } = reconcileOrder({ wanted: wantAB, recorded: new Map([["pA", 1]]), boms: { pA: bomA, pB: bomB }, netCut: net });
  assert.deepEqual(lines.map((l) => [l.productId, l.cutQty, l.missingQty, l.extraQty]), [["pA", 1, 0, 0], ["pB", 0, 1, 0]]);
});
t("reconcile: recorded says both cut but inventory shows only one -> inventory wins", () => {
  const net = netCutByComponent([{ inventoryItemId: "iA", type: "deduction", quantity: 1 }]);
  const { lines } = reconcileOrder({ wanted: wantAB, recorded: new Map([["pA", 1], ["pB", 1]]), boms: { pA: bomA, pB: bomB }, netCut: net });
  assert.equal(lines.find((l) => l.productId === "pB")!.missingQty, 1);
});
t("reconcile: double deduction of Seek Rush reported as extra, Charades missing", () => {
  const net = netCutByComponent([
    { inventoryItemId: "iA", type: "deduction", quantity: 1 },
    { inventoryItemId: "iA", type: "deduction", quantity: 1 },
  ]);
  const { lines } = reconcileOrder({ wanted: wantAB, recorded: new Map(), boms: { pA: bomA, pB: bomB }, netCut: net });
  assert.deepEqual(lines.map((l) => [l.productId, l.cutQty, l.missingQty, l.extraQty]), [["pA", 2, 0, 1], ["pB", 0, 1, 0]]);
});
t("reconcile: qty 1 + 2 with 1 + 1 cut -> only 1 more of B; restores are netted", () => {
  const net = netCutByComponent([
    { inventoryItemId: "iA", type: "deduction", quantity: 1 },
    { inventoryItemId: "iB", type: "deduction", quantity: 2 },
    { inventoryItemId: "iB", type: "addition", quantity: 1 },
  ]);
  const { lines } = reconcileOrder({
    wanted: [wantAB[0], { ...wantAB[1], quantity: 2 }],
    recorded: new Map(),
    boms: { pA: bomA, pB: bomB },
    netCut: net,
  });
  assert.deepEqual(lines.map((l) => [l.missingQty, l.extraQty]), [[0, 0], [1, 0]]);
});
t("reconcile: fully cut -> nothing missing (idempotent second run)", () => {
  const net = netCutByComponent([
    { inventoryItemId: "iA", type: "deduction", quantity: 1 },
    { inventoryItemId: "iB", type: "deduction", quantity: 1 },
  ]);
  const { lines, unexplained } = reconcileOrder({ wanted: wantAB, recorded: new Map(), boms: { pA: bomA, pB: bomB }, netCut: net });
  assert.ok(lines.every((l) => l.missingQty === 0 && l.extraQty === 0));
  assert.equal(unexplained.length, 0);
});
t("reconcile: product cut but not in email is listed (expected 0, extra)", () => {
  const net = netCutByComponent([{ inventoryItemId: "iC", type: "deduction", quantity: 1 }]);
  const { lines } = reconcileOrder({
    wanted: [wantAB[0]],
    others: [{ productId: "pC", productName: "Wrong" }],
    recorded: new Map([["pC", 1]]),
    boms: { pA: bomA, pC: [{ inventoryItemId: "iC", quantity: 1 }] },
    netCut: net,
  });
  assert.deepEqual(lines.map((l) => [l.productId, l.missingQty, l.extraQty]), [["pA", 1, 0], ["pC", 0, 1]]);
});
t("reconcile: no inventory rows -> falls back to recorded quantities", () => {
  const { lines } = reconcileOrder({ wanted: wantAB, recorded: new Map([["pA", 1]]), boms: { pA: bomA, pB: bomB }, netCut: null });
  assert.deepEqual(lines.map((l) => [l.missingQty, l.source]), [[0, "recorded"], [1, "recorded"]]);
});

console.log(`\n${pass} tests passed`);