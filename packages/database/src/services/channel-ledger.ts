/**
 * Order-level channel stock ledger.
 *
 *  - ChannelOrder (one per normalised marketplace order id) merges every email of the order.
 *    Desired qty per product = MAX over emails (a duplicate / re-sent email never adds stock cut).
 *  - ChannelStockLedger (one per order + product, unique _id) holds units already cut.
 *  - Stock moved = desired - ledger. Running it twice moves nothing (idempotent).
 *  - Only one sync per order at a time (ChannelStockOrder.syncLockAt). Every move is first written as
 *    `pending` (op id + exact component lines) on the ledger row; each component move is exactly-once
 *    (token stored atomically with the $inc on InventoryItem.channelOps). A crashed sync is finished
 *    on the next sync by replaying the same op - never cut twice.
 *  - Orders cut by the old code are adopted from their actual InventoryTransaction rows (all reason-id
 *    variants): automatically when nothing has to move, else only via the confirmed Repair.
 */
import mongoose from "mongoose";
import crypto from "node:crypto";
import connectDB from "../connection";
import ChannelStockOrder from "../models/ChannelStockOrder";
import ChannelStockLedger from "../models/ChannelStockLedger";
import ChannelOrderEvent from "../models/ChannelOrderEvent";
import InventoryItem from "../models/InventoryItem";
import InventoryTransaction from "../models/InventoryTransaction";
import ProductConfig from "../models/ProductConfig";
import { syncAffectedProducts } from "./inventory-sync";
import { normalizeChannelOrderId } from "./channel-email-parse";
import { netCutByComponent } from "./channel-reconcile";

export type OrderLine = { productId: string; productName: string; quantity: number };
export type ComponentLine = { inventoryItemId: string; inventoryItemName: string; quantity: number };
export type BomComponent = { inventoryItemId: string; inventoryItemName: string; quantity: number };

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested without a DB)
// ---------------------------------------------------------------------------

/** Order key for an event: normalised marketplace id, else per-message key. */
export function channelOrderKey(event: { externalOrderId?: unknown; gmailMessageId?: unknown }): string {
  const id = normalizeChannelOrderId(event?.externalOrderId);
  return id || `MSG-${String(event?.gmailMessageId || "")}`;
}

/** Reason id written on InventoryTransaction for ledger moves (same format as before). */
export function ledgerReasonId(orderKey: string) {
  return `CH-${orderKey}`;
}

/** Every reason id stock may have been cut under for these events (old raw ids, normalised id, MSG fallback). */
export function reasonIdsForEvents(
  orderKey: string,
  events: Array<{ externalOrderId?: unknown; gmailMessageId?: unknown }>
): string[] {
  const out = new Set<string>([`CH-${orderKey}`]);
  for (const e of events || []) {
    const raw = String(e?.externalOrderId || "").trim();
    if (raw) out.add(`CH-${raw}`);
    const gid = String(e?.gmailMessageId || "");
    if (gid) out.add(`CH-MSG-${gid.slice(-8)}`);
  }
  return [...out];
}

/** Sum lines of ONE email by product. */
export function sumLines(lines: Array<{ productId?: unknown; productName?: string; quantity?: unknown }>): Map<string, OrderLine> {
  const map = new Map<string, OrderLine>();
  for (const l of lines || []) {
    const id = String(l?.productId || "");
    if (!id) continue;
    const q = Math.max(0, Math.floor(Number(l.quantity) || 0));
    const prev = map.get(id);
    if (prev) prev.quantity += q;
    else map.set(id, { productId: id, productName: l.productName || "", quantity: q });
  }
  return map;
}

/**
 * Desired units per product for an order: each email summed by product, then MAX across emails
 * (duplicate emails of one order restate the same items, so they must never add up).
 */
export function mergeOrderDesired(sources: OrderLine[][], manual: OrderLine[] = []): Map<string, OrderLine> {
  const out = new Map<string, OrderLine>();
  for (const src of [...(sources || []), manual || []]) {
    for (const line of sumLines(src).values()) {
      const prev = out.get(line.productId);
      if (!prev) out.set(line.productId, { ...line });
      else {
        prev.quantity = Math.max(prev.quantity, line.quantity);
        if (!prev.productName) prev.productName = line.productName;
      }
    }
  }
  return out;
}

export type LedgerDelta = { productId: string; productName: string; from: number; to: number; delta: number };

/** desired - ledger per product (positive = cut, negative = restore). */
export function planLedgerDeltas(
  desired: Map<string, OrderLine>,
  ledger: Map<string, { quantity: number; productName?: string }>
): LedgerDelta[] {
  const ids = new Set([...desired.keys(), ...ledger.keys()]);
  const out: LedgerDelta[] = [];
  for (const id of ids) {
    const to = desired.get(id)?.quantity || 0;
    const from = ledger.get(id)?.quantity || 0;
    if (to !== from) {
      out.push({
        productId: id,
        productName: desired.get(id)?.productName || ledger.get(id)?.productName || id,
        from,
        to,
        delta: to - from,
      });
    }
  }
  return out;
}

/** Components to cut for `units` more of a product (BOM x units). */
export function componentsToCut(bom: BomComponent[], units: number): ComponentLine[] {
  return (bom || [])
    .filter((c) => Number(c.quantity) > 0)
    .map((c) => ({
      inventoryItemId: String(c.inventoryItemId),
      inventoryItemName: c.inventoryItemName || "",
      quantity: Number(c.quantity) * units,
    }));
}

/** Components to give back for `units` fewer, from what was ACTUALLY cut (immune to later BOM edits). */
export function componentsToRestore(cut: ComponentLine[], cutUnits: number, units: number): ComponentLine[] {
  if (cutUnits <= 0 || units <= 0) return [];
  return (cut || [])
    .map((c) => ({
      inventoryItemId: String(c.inventoryItemId),
      inventoryItemName: c.inventoryItemName || "",
      quantity: units >= cutUnits ? Number(c.quantity) : Math.round((Number(c.quantity) * units) / cutUnits),
    }))
    .filter((c) => c.quantity > 0);
}

/** a +/- b per inventory item (sign = 1 add, -1 subtract). */
export function addComponents(a: ComponentLine[], b: ComponentLine[], sign = 1): ComponentLine[] {
  const map = new Map<string, ComponentLine>();
  for (const c of a || []) map.set(String(c.inventoryItemId), { ...c, inventoryItemId: String(c.inventoryItemId) });
  for (const c of b || []) {
    const id = String(c.inventoryItemId);
    const prev = map.get(id);
    const q = (prev?.quantity || 0) + sign * Number(c.quantity || 0);
    map.set(id, { inventoryItemId: id, inventoryItemName: c.inventoryItemName || prev?.inventoryItemName || "", quantity: q });
  }
  return [...map.values()].filter((c) => c.quantity !== 0);
}

export type RepairEventInput = {
  _id: unknown;
  gmailMessageId?: string;
  eventType?: string;
  status?: string;
  subject?: string;
  receivedAt?: Date | string | null;
  externalOrderId?: string;
  matchedItems?: Array<{ productId?: unknown; productName?: string; quantity?: unknown }>;
  extracted?: { expectedItemCount?: number | null; items?: unknown[] } | null;
  /** lines from a fresh re-parse of the email (count OK + all SKUs matched), if any */
  reparsed?: OrderLine[] | null;
};

export type OrderRepairRow = {
  orderId: string;
  eventIds: string[];
  /** events that are copies of another event (same Gmail message) or re-sent emails */
  duplicateEventIds: string[];
  expectedItems: number | null;
  desired: OrderLine[];
  cancelled: boolean;
  /** per inventory component: should be cut vs actually cut (net of restores) */
  components: Array<{ inventoryItemId: string; inventoryItemName: string; expected: number; actual: number; diff: number }>;
  toCut: ComponentLine[];
  toRestore: ComponentLine[];
  blockers: string[];
  action: "ok" | "fix" | "review";
  result?: string;
};

function itemsSold(subject = ""): number | null {
  const m = String(subject).match(/(\d+)\s+items?\s+sold/i);
  return m ? Number(m[1]) : null;
}

/**
 * Pure: decide what an order SHOULD have cut (all its emails merged) vs what the inventory
 * transactions say WAS cut, per component. No writes.
 */
export function planOrderRepair(input: {
  orderId: string;
  events: RepairEventInput[];
  manualLines?: OrderLine[];
  cancelledFlag?: boolean;
  txs: Array<{ inventoryItemId: unknown; inventoryItemName?: string; type: string; quantity: number }>;
  boms: Record<string, BomComponent[]>;
}): OrderRepairRow {
  const blockers: string[] = [];
  const orderEvents = input.events.filter((e) => e.eventType === "order" && e.status !== "ignored");
  const cancelled =
    !!input.cancelledFlag ||
    input.events.some((e) => e.eventType === "cancel" && e.status === "restored") ||
    orderEvents.some((e) => e.status === "restored");

  // Copies of the same Gmail message, and further emails of the same order
  const seenMsg = new Set<string>();
  const duplicateEventIds: string[] = [];
  const sorted = [...orderEvents].sort(
    (a, b) => new Date(a.receivedAt || 0).getTime() - new Date(b.receivedAt || 0).getTime() || String(a._id).localeCompare(String(b._id))
  );
  sorted.forEach((e, i) => {
    const gid = String(e.gmailMessageId || "");
    if ((gid && seenMsg.has(gid)) || i > 0) duplicateEventIds.push(String(e._id));
    if (gid) seenMsg.add(gid);
  });

  let expected: number | null = null;
  const sources: OrderLine[][] = [];
  for (const e of sorted) {
    const exp =
      (typeof e.extracted?.expectedItemCount === "number" ? e.extracted.expectedItemCount : null) ?? itemsSold(e.subject);
    if (exp && (expected === null || exp > expected)) expected = exp;
    if (e.reparsed?.length) sources.push(e.reparsed);
    else if (e.matchedItems?.length) sources.push(e.matchedItems as OrderLine[]);
  }
  const desiredMap = cancelled ? new Map<string, OrderLine>() : mergeOrderDesired(sources, input.manualLines || []);
  const desired = [...desiredMap.values()].filter((l) => l.quantity > 0);
  const desiredUnits = desired.reduce((s, l) => s + l.quantity, 0);
  if (!cancelled) {
    if (!orderEvents.length && !(input.manualLines || []).length) blockers.push("No order email for this id");
    if (expected !== null && desiredUnits < expected) {
      blockers.push(`Email says ${expected} item(s) but only ${desiredUnits} known - use Re-check items first`);
    }
    if (expected !== null && desiredUnits > expected) {
      blockers.push(`Emails list ${desiredUnits} unit(s) but the order is ${expected} item(s) - check by hand`);
    }
  }

  const expComp = new Map<string, ComponentLine>();
  for (const line of desired) {
    const bom = input.boms[line.productId];
    if (!bom?.length) {
      blockers.push(`${line.productName || line.productId} has no active inventory config`);
      continue;
    }
    for (const c of componentsToCut(bom, line.quantity)) {
      const prev = expComp.get(c.inventoryItemId);
      if (prev) prev.quantity += c.quantity;
      else expComp.set(c.inventoryItemId, { ...c });
    }
  }
  const net = netCutByComponent(input.txs as any);
  const names = new Map<string, string>();
  for (const t of input.txs) names.set(String(t.inventoryItemId), t.inventoryItemName || "");
  const ids = new Set([...expComp.keys(), ...net.keys()]);
  const components: OrderRepairRow["components"] = [];
  const toCut: ComponentLine[] = [];
  const toRestore: ComponentLine[] = [];
  for (const id of ids) {
    const exp = expComp.get(id)?.quantity || 0;
    const act = net.get(id) || 0;
    const name = expComp.get(id)?.inventoryItemName || names.get(id) || id;
    const diff = exp - act;
    components.push({ inventoryItemId: id, inventoryItemName: name, expected: exp, actual: act, diff });
    if (diff > 0) toCut.push({ inventoryItemId: id, inventoryItemName: name, quantity: diff });
    if (diff < 0) toRestore.push({ inventoryItemId: id, inventoryItemName: name, quantity: -diff });
  }
  const action: OrderRepairRow["action"] = blockers.length ? "review" : toCut.length || toRestore.length ? "fix" : "ok";
  return {
    orderId: input.orderId,
    eventIds: sorted.map((e) => String(e._id)),
    duplicateEventIds,
    expectedItems: expected,
    desired,
    cancelled,
    components,
    toCut,
    toRestore,
    blockers,
    action,
  };
}

// ---------------------------------------------------------------------------
// DB: order record + ledger sync
// ---------------------------------------------------------------------------

const LOCK_STALE_MS = 10 * 60 * 1000;

function newOpId() {
  return crypto.randomUUID();
}

async function ensureChannelOrder(orderKey: string, externalOrderId = "") {
  try {
    await ChannelStockOrder.updateOne(
      { _id: orderKey },
      { $setOnInsert: { _id: orderKey, externalOrderId: externalOrderId || orderKey } },
      { upsert: true }
    );
  } catch (error: any) {
    if (error?.code !== 11000) throw error; // concurrent upsert: the other insert won
  }
}

/** Record (or replace) what one email says for its order. `trusted` = may drive stock. */
export async function recordChannelOrderSource(
  event: any,
  lines: OrderLine[],
  opts: { trusted: boolean; by?: string }
): Promise<string> {
  await connectDB();
  const orderKey = channelOrderKey(event);
  await ensureChannelOrder(orderKey, normalizeChannelOrderId(event.externalOrderId));
  await ChannelStockOrder.updateOne({ _id: orderKey }, { $pull: { sources: { eventId: event._id } } });
  await ChannelStockOrder.updateOne(
    { _id: orderKey },
    {
      $push: {
        sources: {
          eventId: event._id,
          gmailMessageId: String(event.gmailMessageId || ""),
          lines: [...sumLines(lines).values()],
          trusted: !!opts.trusted,
          by: opts.by || "",
          at: new Date(),
        },
      },
    }
  );
  await ChannelOrderEvent.updateOne({ _id: event._id }, { $set: { orderKey } });
  return orderKey;
}

export async function setChannelOrderManualLines(orderKey: string, lines: OrderLine[]) {
  await connectDB();
  const order: any = await ChannelStockOrder.findById(orderKey).lean();
  const merged = mergeOrderDesired([(order?.manualLines || []) as OrderLine[]], lines);
  await ChannelStockOrder.updateOne({ _id: orderKey }, { $set: { manualLines: [...merged.values()] } });
}

export async function setChannelOrderCancelled(orderKey: string, cancelled: boolean) {
  await connectDB();
  await ensureChannelOrder(orderKey);
  await ChannelStockOrder.updateOne({ _id: orderKey }, { $set: { cancelled } });
}

async function claimOrderLock(orderKey: string) {
  const opId = newOpId();
  const order = await ChannelStockOrder.findOneAndUpdate(
    {
      _id: orderKey,
      $or: [{ syncLockAt: null }, { syncLockAt: { $exists: false } }, { syncLockAt: { $lt: new Date(Date.now() - LOCK_STALE_MS) } }],
    },
    { $set: { syncLockAt: new Date(), syncOpId: opId } },
    { new: true }
  );
  return order ? { order: order as any, opId } : null;
}

async function releaseOrderLock(orderKey: string, opId: string, set: Record<string, unknown> = {}) {
  await ChannelStockOrder.updateOne({ _id: orderKey, syncOpId: opId }, { $set: { syncLockAt: null, ...set } });
}

async function activeBoms(productIds: string[]): Promise<Record<string, BomComponent[]>> {
  const valid = productIds.filter((id) => mongoose.isValidObjectId(id));
  const configs = (await ProductConfig.find({ productId: { $in: valid }, isActive: true })
    .select("productId components")
    .lean()) as any[];
  const out: Record<string, BomComponent[]> = {};
  for (const c of configs) {
    out[String(c.productId)] = (c.components || []).map((x: any) => ({
      inventoryItemId: String(x.inventoryItemId),
      inventoryItemName: x.inventoryItemName || "",
      quantity: Number(x.quantity) || 0,
    }));
  }
  return out;
}

/** Test-only fault injection (simulates a process crash at a precise point). Never set in production. */
export const channelLedgerFaults: { afterStockWrite?: (token: string) => void; afterMoves?: (orderKey: string) => void } = {};

/**
 * Move stock for component lines - EXACTLY ONCE per (op, item), even across crashes and retries.
 *
 * The stock change and its idempotency token are written in ONE atomic single-document update
 * on the InventoryItem (`$inc` + `$push channelOps` guarded by `channelOps.t != token`). A retry
 * with the same token can never move stock twice; it only (re)writes the missing log row, which
 * is upserted by (channelOpId, inventoryItemId).
 */
async function moveComponents(
  lines: ComponentLine[],
  kind: "deduction" | "addition",
  tag: { reasonId: string; ledgerKey: string; opId: string; productName: string; by: string; reason: string },
  affected: Set<string>
) {
  const moved: ComponentLine[] = [];
  const sign = kind === "deduction" ? -1 : 1;
  for (const line of lines) {
    if (!(line.quantity > 0)) continue;
    const token = `${tag.opId}#${tag.ledgerKey}#${kind}#${line.inventoryItemId}`;
    let item: any = await InventoryItem.findOneAndUpdate(
      { _id: line.inventoryItemId, "channelOps.t": { $ne: token } },
      {
        $inc: { currentStock: sign * line.quantity },
        $push: { channelOps: { $each: [{ t: token, q: line.quantity, at: new Date() }], $slice: -5000 } },
      },
      { new: true }
    );
    let quantity = line.quantity;
    let previousStock: number | null = null;
    if (item) {
      previousStock = item.currentStock - sign * line.quantity;
    } else {
      // Already applied by an earlier (crashed) attempt with the same token: never move again
      item = await InventoryItem.findOne({ _id: line.inventoryItemId }).select("+channelOps name currentStock");
      if (!item) throw new Error(`Inventory item missing: ${line.inventoryItemName || line.inventoryItemId}`);
      const op = (item.channelOps || []).find((o: any) => o.t === token);
      if (!op) throw new Error(`Inventory op lost for ${item.name}`);
      quantity = Number(op.q) || line.quantity;
    }
    affected.add(String(item._id));
    channelLedgerFaults.afterStockWrite?.(token);
    await InventoryTransaction.updateOne(
      { channelOpId: token, inventoryItemId: item._id },
      {
        $setOnInsert: {
          inventoryItemId: item._id,
          inventoryItemName: item.name,
          type: kind,
          quantity,
          previousStock: previousStock ?? item.currentStock,
          newStock: previousStock === null ? item.currentStock : item.currentStock,
          orderId: tag.reasonId,
          productName: tag.productName,
          reason: previousStock === null ? `${tag.reason} (log written on retry)` : tag.reason,
          performedBy: tag.by || "channel-email",
          channelLedgerKey: tag.ledgerKey,
          channelOpId: token,
          // createdAt/updatedAt come from the schema's timestamps on upsert
        },
      },
      { upsert: true }
    );
    moved.push({ inventoryItemId: String(item._id), inventoryItemName: item.name || line.inventoryItemName, quantity });
  }
  return moved;
}

/** Events of this order, also matching legacy rows whose stored id was not normalised. */
export async function findOrderEvents(orderKey: string) {
  if (orderKey.startsWith("MSG-")) {
    return (await ChannelOrderEvent.find({ gmailMessageId: orderKey.slice(4) }).lean()) as any[];
  }
  const amz = orderKey.match(/^(\d{3})-(\d{7})-(\d{7})$/);
  // legacy rows may store the id with spaces / other dashes / no separator
  const rx = amz
    ? `${amz[1]}[\\s\\-\\x{2010}-\\x{2015}]*${amz[2]}[\\s\\-\\x{2010}-\\x{2015}]*${amz[3]}`
    : orderKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (await ChannelOrderEvent.find({
    $or: [{ orderKey }, { externalOrderId: { $regex: rx, $options: "i" } }],
  }).lean()) as any[];
}

/** True when stock was cut for this order outside the ledger (old code) and repair has not run. */
async function hasLegacyCuts(orderKey: string, events: any[]) {
  return !!(await InventoryTransaction.exists({
    orderId: { $in: reasonIdsForEvents(orderKey, events) },
    $or: [{ channelLedgerKey: { $exists: false } }, { channelLedgerKey: null }, { channelLedgerKey: "" }],
  }));
}

export type OrderSyncResult = {
  status: "synced" | "busy" | "needs_repair" | "review" | "error";
  orderKey: string;
  cut: Array<{ productId: string; productName: string; quantity: number }>;
  restored: Array<{ productId: string; productName: string; quantity: number }>;
  snapshot: ComponentLine[];
  note: string;
};

/**
 * Bring stock for ONE order to "desired" (all its trusted emails merged + admin lines; 0 if cancelled).
 * Safe to call any number of times, from any process: one order lock, desired - ledger deltas,
 * crash-safe pending markers. Returns what moved.
 */
export async function syncChannelOrderStock(orderKey: string, opts: { by?: string; waitMs?: number } = {}): Promise<OrderSyncResult> {
  await connectDB();
  const result: OrderSyncResult = { status: "synced", orderKey, cut: [], restored: [], snapshot: [], note: "" };
  await ensureChannelOrder(orderKey);

  let claim = await claimOrderLock(orderKey);
  const deadline = Date.now() + (opts.waitMs ?? 8000);
  while (!claim && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 400));
    claim = await claimOrderLock(orderKey);
  }
  if (!claim) return { ...result, status: "busy", note: "Another update is running for this order - try again shortly" };
  const { order, opId } = claim;
  const by = opts.by || "channel-email";
  const affected = new Set<string>();
  let lockSet: Record<string, unknown> = { lastSyncAt: new Date() };

  try {
    const ledgers = (await ChannelStockLedger.find({ orderKey }).lean()) as any[];

    // 1. Finish interrupted moves: replay the SAME op (idempotent per item), then commit the ledger
    for (const l of ledgers) {
      if (!l.pending) continue;
      const p = l.pending;
      const moved = await moveComponents(p.components || [], p.kind, {
        reasonId: ledgerReasonId(orderKey),
        ledgerKey: l._id,
        opId: p.opId,
        productName: l.productName,
        by,
        reason: `Channel email order ${ledgerReasonId(orderKey)} (recovered ${p.kind} for ${l.productName})`,
      }, affected);
      const comps = addComponents(l.components || [], moved, p.kind === "deduction" ? 1 : -1);
      await ChannelStockLedger.updateOne(
        { _id: l._id, "pending.opId": p.opId },
        { $set: { quantity: p.target, components: comps, pending: null }, $push: { history: { opId: p.opId, from: l.quantity, to: p.target, by, note: "recovered after interruption" } } }
      );
      l.quantity = p.target;
      l.components = comps;
      l.pending = null;
    }

    const events = await findOrderEvents(orderKey);
    // 2. Order cut by the old code: ADOPT it from its actual stock moves (all reason-id variants).
    //    Auto only when that moves no stock (actual == expected) or it is a cancel (return exactly what was cut).
    //    Any other difference waits for an admin-confirmed Repair.
    let current: any = order;
    if (!ledgers.length && !order.repairedAt && (await hasLegacyCuts(orderKey, events))) {
      const row = await buildRowForOrder(orderKey);
      const autoOk = row.action === "ok" || (row.cancelled && !row.blockers.length && !row.toCut.length);
      if (!autoOk) {
        lockSet = { ...lockSet, needsRepair: true, note: "Stock was cut by the old sync and does not match the emails - run Repair (dry run, then confirm)" };
        return { ...result, status: "needs_repair", note: String(lockSet.note) };
      }
      await repairLocked(orderKey, row, by, affected);
      result.restored.push(...row.toRestore.map((c) => ({ productId: c.inventoryItemId, productName: c.inventoryItemName, quantity: c.quantity })));
      result.note = row.toRestore.length ? "Old order cancelled: returned exactly what was cut" : "Old order adopted into the ledger (no stock change)";
      current = await ChannelStockOrder.findById(orderKey).lean();
      ledgers.splice(0, ledgers.length, ...((await ChannelStockLedger.find({ orderKey }).lean()) as any[]));
    }

    // 3. desired - ledger
    const trusted = (current.sources || []).filter((s: any) => s.trusted).map((s: any) => s.lines as OrderLine[]);
    const desired = current.cancelled ? new Map<string, OrderLine>() : mergeOrderDesired(trusted, current.manualLines || []);
    const ledgerMap = new Map<string, any>(ledgers.map((l) => [String(l.productId), l]));
    const deltas = planLedgerDeltas(desired, ledgerMap);
    if (!deltas.length) {
      result.note = result.note || "Already cut for this order";
      lockSet = { ...lockSet, needsRepair: false, note: result.note };
      return result;
    }
    const boms = await activeBoms(deltas.filter((d) => d.delta > 0).map((d) => d.productId));
    const noBom = deltas.filter((d) => d.delta > 0 && !boms[d.productId]?.length).map((d) => d.productName);
    if (noBom.length) {
      result.status = "error";
      result.note = `Not configured for inventory: ${noBom.join(", ")}`;
      return result;
    }

    const reasonId = ledgerReasonId(orderKey);
    for (const d of deltas) {
      const key = `${orderKey}|${d.productId}`;
      const prev = ledgerMap.get(d.productId);
      const comps =
        d.delta > 0
          ? componentsToCut(boms[d.productId], d.delta)
          : componentsToRestore(prev?.components || [], prev?.quantity || 0, -d.delta);
      const kind = d.delta > 0 ? "deduction" : "addition";
      const stepOp = `${opId}:${d.productId}`;
      // Mark pending BEFORE touching stock (CAS on the quantity we read)
      const marked = await ChannelStockLedger.updateOne(
        { _id: key, quantity: d.from, pending: null },
        {
          $setOnInsert: { orderKey, productId: d.productId, productName: d.productName },
          $set: { pending: { opId: stepOp, target: d.to, kind, components: comps, at: new Date() } },
        },
        { upsert: !prev }
      ).catch((e: any) => {
        if (e?.code === 11000) return { matchedCount: 0, upsertedCount: 0 } as any;
        throw e;
      });
      if (!(marked.matchedCount || marked.upsertedCount)) {
        result.status = "review";
        result.note = `Ledger for ${d.productName} changed while syncing - nothing moved for it`;
        continue;
      }
      const moved = await moveComponents(comps, kind, {
        reasonId,
        ledgerKey: key,
        opId: stepOp,
        productName: d.productName,
        by,
        reason: `Channel email order ${reasonId} (${kind === "deduction" ? "cut" : "restore"} ${Math.abs(d.delta)} x ${d.productName})`,
      }, affected);
      channelLedgerFaults.afterMoves?.(orderKey);
      await ChannelStockLedger.updateOne(
        { _id: key, "pending.opId": stepOp },
        {
          $set: { quantity: d.to, productName: d.productName, components: addComponents(prev?.components || [], moved, kind === "deduction" ? 1 : -1), pending: null },
          $push: { history: { opId: stepOp, from: d.from, to: d.to, by, note: kind } },
        }
      );
      const line = { productId: d.productId, productName: d.productName, quantity: Math.abs(d.delta) };
      if (kind === "deduction") {
        result.cut.push(line);
        result.snapshot.push(...moved);
      } else result.restored.push(line);
    }
    lockSet = { ...lockSet, needsRepair: false, note: result.note };
    return result;
  } catch (error) {
    lockSet = { ...lockSet, needsReview: true, note: error instanceof Error ? error.message : "Stock sync failed" };
    return { ...result, status: "error", note: String(lockSet.note) };
  } finally {
    if (affected.size) await syncAffectedProducts([...affected]).catch(() => undefined);
    await releaseOrderLock(orderKey, opId, lockSet);
  }
}

/** Ledger quantities for an order (for Re-check). */
export async function getOrderLedger(orderKey: string) {
  await connectDB();
  return (await ChannelStockLedger.find({ orderKey }).lean()) as any[];
}

// ---------------------------------------------------------------------------
// One-time repair / reconciliation report
// ---------------------------------------------------------------------------

export const REPAIR_CONFIRM = "REPAIR";

export async function buildRowForOrder(
  orderKey: string,
  reparse?: (event: any) => Promise<OrderLine[] | null>
): Promise<OrderRepairRow> {
  const events = await findOrderEvents(orderKey);
  const order: any = await ChannelStockOrder.findById(orderKey).lean();
  const inputs: RepairEventInput[] = [];
  for (const e of events) {
    let reparsed: OrderLine[] | null = null;
    const exp = typeof e.extracted?.expectedItemCount === "number" ? e.extracted.expectedItemCount : itemsSold(e.subject);
    const known = [...sumLines(e.matchedItems || []).values()].reduce((s, l) => s + l.quantity, 0);
    if (reparse && e.eventType === "order" && e.status !== "ignored" && exp && known < exp) {
      reparsed = await reparse(e).catch(() => null);
    }
    inputs.push({ ...e, reparsed });
  }
  const txs = (await InventoryTransaction.find({ orderId: { $in: reasonIdsForEvents(orderKey, events) } })
    .select("inventoryItemId inventoryItemName type quantity")
    .lean()) as any[];
  const productIds = new Set<string>();
  for (const e of inputs) for (const l of [...(e.reparsed || []), ...((e.matchedItems as any[]) || [])]) productIds.add(String(l.productId || ""));
  for (const l of order?.manualLines || []) productIds.add(String(l.productId));
  const boms = await activeBoms([...productIds].filter(Boolean));
  return planOrderRepair({
    orderId: orderKey,
    events: inputs,
    manualLines: order?.manualLines || [],
    cancelledFlag: !!order?.cancelled,
    txs,
    boms,
  });
}

/** Distinct normalised order ids that have channel events. */
async function listOrderKeys(limit: number, since?: Date | null): Promise<string[]> {
  const filter: Record<string, unknown> = { eventType: { $in: ["order", "cancel"] }, externalOrderId: { $nin: ["", null] } };
  if (since) filter.receivedAt = { $gte: since };
  const ids = (await ChannelOrderEvent.distinct("externalOrderId", filter)) as string[];
  const keys = [...new Set(ids.map((i) => normalizeChannelOrderId(i)).filter(Boolean))].sort();
  return keys.slice(0, limit);
}

export type RepairSummary = { scanned: number; toFix: number; ok: number; review: number; duplicates: number; applied: boolean };

/**
 * Reconciliation report (default) or repair (apply + confirm === "REPAIR" + explicit order ids from the dry run).
 * Apply per order, under the order lock: re-computes the row, restores over-cut / cuts under-cut components
 * (tagged `<order>|repair`), seeds the ledger to the desired quantities, records every email as a source and
 * marks extra emails as duplicates. Re-running finds nothing to do (idempotent).
 */
export async function repairChannelOrders(opts: {
  apply?: boolean;
  confirm?: string;
  orderIds?: string[];
  by?: string;
  limit?: number;
  since?: Date | null;
  reparse?: (event: any) => Promise<OrderLine[] | null>;
}): Promise<{ summary: RepairSummary; rows: OrderRepairRow[] }> {
  await connectDB();
  const apply = opts.apply === true;
  if (apply && opts.confirm !== REPAIR_CONFIRM) throw new Error(`Repair needs confirm: "${REPAIR_CONFIRM}"`);
  if (apply && !(opts.orderIds || []).length) throw new Error("Repair needs the order ids from the dry run");
  const limit = Math.min(Math.max(Number(opts.limit) || 2000, 1), 5000);
  const keys = (opts.orderIds || []).length
    ? [...new Set(opts.orderIds!.map((i) => normalizeChannelOrderId(i)).filter(Boolean))].slice(0, limit)
    : await listOrderKeys(limit, opts.since);

  const rows: OrderRepairRow[] = [];
  for (const key of keys) {
    if (!apply) {
      rows.push(await buildRowForOrder(key, opts.reparse));
      continue;
    }
    rows.push(await applyRepairForOrder(key, opts.by || "admin", opts.reparse));
  }
  return {
    summary: {
      scanned: rows.length,
      toFix: rows.filter((r) => r.action === "fix").length,
      ok: rows.filter((r) => r.action === "ok").length,
      review: rows.filter((r) => r.action === "review").length,
      duplicates: rows.reduce((s, r) => s + r.duplicateEventIds.length, 0),
      applied: apply,
    },
    rows,
  };
}

/**
 * Apply a repair row while holding the order lock: correct stock by the exact component diff, then
 * seed the ledger = desired. Op ids derive from repairGen, so a repair that crashed half-way and is
 * run again replays the same ops (no double move) and only does what is still missing.
 */
async function repairLocked(orderKey: string, row: OrderRepairRow, by: string, affected: Set<string>) {
  const order: any = await ChannelStockOrder.findById(orderKey).select("repairGen").lean();
  const gen = Number(order?.repairGen) || 0;
  const opId = `repair:${orderKey}:${gen}`;
  const reasonId = ledgerReasonId(orderKey);
  const tag = { reasonId, ledgerKey: `${orderKey}|repair`, opId, productName: "repair", by };
  if (row.toRestore.length) {
    await moveComponents(row.toRestore, "addition", { ...tag, reason: `Channel repair ${reasonId}: return over-cut stock` }, affected);
  }
  if (row.toCut.length) {
    await moveComponents(row.toCut, "deduction", { ...tag, reason: `Channel repair ${reasonId}: cut missing stock` }, affected);
  }
  channelLedgerFaults.afterMoves?.(orderKey);
  // Seed the ledger = desired, using the current BOM (true now after the correction above)
  const boms = await activeBoms(row.desired.map((d) => d.productId));
  const keep: string[] = [];
  for (const d of row.desired) {
    const id = `${orderKey}|${d.productId}`;
    keep.push(id);
    await ChannelStockLedger.updateOne(
      { _id: id },
      {
        $set: {
          orderKey,
          productId: d.productId,
          productName: d.productName,
          quantity: d.quantity,
          components: componentsToCut(boms[d.productId] || [], d.quantity),
          pending: null,
        },
        $push: { history: { opId, from: null, to: d.quantity, by, note: "repair seed" } },
      },
      { upsert: true }
    );
  }
  await ChannelStockLedger.deleteMany({ orderKey, _id: { $nin: keep } });
  // Every email becomes a source of the order; extra ones are labelled duplicates
  const events = await findOrderEvents(orderKey);
  const sources = events
    .filter((e) => e.eventType === "order" && e.status !== "ignored")
    .map((e) => ({ eventId: e._id, gmailMessageId: e.gmailMessageId || "", lines: [...sumLines(e.matchedItems || []).values()], trusted: true, by, at: new Date() }));
  await ChannelStockOrder.updateOne(
    { _id: orderKey },
    {
      $set: { sources, cancelled: row.cancelled, manualLines: row.desired, repairedAt: new Date(), needsRepair: false },
      $inc: { repairGen: 1 },
      $push: { history: { action: "repair", by, at: new Date(), note: `cut ${row.toCut.length} / restored ${row.toRestore.length} component line(s)` } },
    }
  );
  await ChannelOrderEvent.updateMany({ _id: { $in: events.map((e) => e._id) } }, { $set: { orderKey } });
  if (row.duplicateEventIds.length) {
    await ChannelOrderEvent.updateMany(
      { _id: { $in: row.duplicateEventIds } },
      { $set: { duplicateOf: row.eventIds[0], backfilledAt: new Date(), backfillNote: "Duplicate email of this order (merged by repair)" } }
    );
  }
}

async function applyRepairForOrder(
  orderKey: string,
  by: string,
  reparse?: (event: any) => Promise<OrderLine[] | null>
): Promise<OrderRepairRow> {
  await ensureChannelOrder(orderKey);
  const claim = await claimOrderLock(orderKey);
  if (!claim) {
    const row = await buildRowForOrder(orderKey, reparse);
    return { ...row, action: "review", result: "Order is being updated right now - run again" };
  }
  const { opId } = claim;
  const affected = new Set<string>();
  let lockSet: Record<string, unknown> = {};
  try {
    // Fresh numbers under the lock - never the client's preview
    const row = await buildRowForOrder(orderKey, reparse);
    if (row.action === "review") {
      row.result = "Left for review (nothing changed)";
      return row;
    }
    const ledgerRows = await ChannelStockLedger.countDocuments({ orderKey });
    if (row.action === "ok" && ledgerRows) {
      row.result = "Already correct";
      return row;
    }
    await repairLocked(orderKey, row, by, affected);
    lockSet = { repairedAt: new Date(), needsRepair: false, needsReview: false, note: "" };
    row.result =
      row.action === "fix"
        ? `Fixed: ${[
            row.toRestore.length ? `returned ${row.toRestore.map((c) => `${c.inventoryItemName} x${c.quantity}`).join(", ")}` : "",
            row.toCut.length ? `cut ${row.toCut.map((c) => `${c.inventoryItemName} x${c.quantity}`).join(", ")}` : "",
          ].filter(Boolean).join("; ")}`
        : "Already correct - ledger seeded";
    return row;
  } catch (error) {
    lockSet = { needsReview: true, note: `Repair failed: ${error instanceof Error ? error.message : "error"} - run the dry run again` };
    const row = await buildRowForOrder(orderKey, reparse).catch(() => null);
    return {
      ...(row || ({ orderId: orderKey, eventIds: [], duplicateEventIds: [], expectedItems: null, desired: [], cancelled: false, components: [], toCut: [], toRestore: [], blockers: [], action: "review" } as OrderRepairRow)),
      action: "review",
      result: String(lockSet.note),
    };
  } finally {
    if (affected.size) await syncAffectedProducts([...affected]).catch(() => undefined);
    await releaseOrderLock(orderKey, opId, lockSet);
  }
}

// ---------------------------------------------------------------------------
// Read-only stock history of one order (admin "Stock history" panel)
// ---------------------------------------------------------------------------

export type OrderStockHistory = {
  orderKey: string;
  exists: boolean;
  cancelled: boolean;
  repairedAt: Date | null;
  note: string;
  products: Array<{ productId: string; productName: string; target: number; cut: number; pending: boolean }>;
  entries: Array<{ at: Date | null; by: string; action: string; product: string; qty: number; note: string }>;
  events: Array<{ _id: string; status: string; eventType: string; subject: string; receivedAt: Date | null; duplicateOf: string | null }>;
};

/** Ledger-based history of one order. Never writes. */
export async function getOrderStockHistory(orderIdOrKey: string): Promise<OrderStockHistory> {
  await connectDB();
  const raw = String(orderIdOrKey || "").trim();
  const orderKey = raw.startsWith("MSG-") ? raw : normalizeChannelOrderId(raw) || raw;
  const [order, ledger, events]: [any, any[], any[]] = await Promise.all([
    ChannelStockOrder.findById(orderKey).lean(),
    ChannelStockLedger.find({ orderKey }).lean() as any,
    findOrderEvents(orderKey),
  ]);
  const desired = order
    ? mergeOrderDesired(
        (order.sources || []).filter((s: any) => s.trusted).map((s: any) => s.lines || []),
        order.manualLines || []
      )
    : new Map<string, OrderLine>();
  const target = order?.cancelled ? new Map<string, OrderLine>() : desired;
  const products = new Map<string, OrderStockHistory["products"][number]>();
  for (const l of target.values()) {
    products.set(l.productId, { productId: l.productId, productName: l.productName, target: l.quantity, cut: 0, pending: false });
  }
  for (const r of ledger) {
    const p = products.get(r.productId) || { productId: r.productId, productName: r.productName || "", target: 0, cut: 0, pending: false };
    p.cut = Number(r.quantity) || 0;
    p.pending = !!r.pending;
    if (!p.productName) p.productName = r.productName || "";
    products.set(r.productId, p);
  }

  const entries: OrderStockHistory["entries"] = [];
  for (const r of ledger) {
    for (const h of r.history || []) {
      const qty = (Number(h.to) || 0) - (Number(h.from) || 0);
      entries.push({
        at: h.at || null,
        by: h.by || "",
        action: qty > 0 ? "ledger cut" : qty < 0 ? "ledger return" : "ledger",
        product: r.productName || r.productId,
        qty,
        note: h.note || `${h.from ?? 0} -> ${h.to ?? 0}`,
      });
    }
  }
  for (const h of order?.history || []) {
    entries.push({ at: h.at || null, by: h.by || "", action: h.action || "order", product: "", qty: 0, note: h.note || "" });
  }
  const txs = (await InventoryTransaction.find({ orderId: { $in: reasonIdsForEvents(orderKey, events) } })
    .select("inventoryItemName type quantity performedBy reason createdAt channelLedgerKey")
    .sort({ createdAt: 1 })
    .limit(500)
    .lean()) as any[];
  for (const t of txs) {
    const q = Math.abs(Number(t.quantity) || 0);
    const repair = String(t.channelLedgerKey || "").endsWith("|repair");
    entries.push({
      at: t.createdAt || null,
      by: String(t.performedBy || ""),
      action: `${repair ? "repair " : ""}${t.type === "addition" ? "stock return" : "stock cut"}`,
      product: t.inventoryItemName || "",
      qty: t.type === "addition" ? q : -q,
      note: t.reason || "",
    });
  }
  entries.sort((a, b) => new Date(a.at || 0).getTime() - new Date(b.at || 0).getTime());

  return {
    orderKey,
    exists: !!order,
    cancelled: !!order?.cancelled,
    repairedAt: order?.repairedAt || null,
    note: order?.note || "",
    products: [...products.values()],
    entries,
    events: events
      .map((e) => ({
        _id: String(e._id),
        status: e.status,
        eventType: e.eventType,
        subject: e.subject || "",
        receivedAt: e.receivedAt || e.createdAt || null,
        duplicateOf: e.duplicateOf ? String(e.duplicateOf) : null,
      }))
      .sort((a, b) => new Date(a.receivedAt || 0).getTime() - new Date(b.receivedAt || 0).getTime()),
  };
}
