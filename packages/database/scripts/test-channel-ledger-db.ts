/**
 * DB-backed guarantees test for the Amazon channel order ledger.
 * Uses an in-memory MongoDB (mongodb-memory-server) - NEVER a real database.
 *
 * Run (Windows):
 *   $env:MMS_DIR="$env:TEMP\swago-mms"; npx tsx packages/database/scripts/test-channel-ledger-db.ts
 */
import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const mmsDir = process.env.MMS_DIR;
if (!mmsDir) throw new Error("Set MMS_DIR to the folder where mongodb-memory-server is installed");
const req = createRequire(path.join(mmsDir, "package.json"));
const { MongoMemoryServer } = req("mongodb-memory-server");

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`FAIL  ${name}`);
    throw e;
  }
}

async function main() {
  const mms = await MongoMemoryServer.create();
  const uri = mms.getUri("ledgertest");
  if (!/127\.0\.0\.1|localhost/.test(uri)) throw new Error("refusing: not a local memory server");
  process.env.MONGODB_URI = uri;

  const mongoose = (await import("mongoose")).default;
  const ledger = await import("../src/services/channel-ledger");
  const sync = await import("../src/services/channel-email-sync");
  const InventoryItem = (await import("../src/models/InventoryItem")).default as any;
  const InventoryTransaction = (await import("../src/models/InventoryTransaction")).default as any;
  const ProductConfig = (await import("../src/models/ProductConfig")).default as any;
  const ChannelOrderEvent = (await import("../src/models/ChannelOrderEvent")).default as any;
  const ChannelOrder = (await import("../src/models/ChannelStockOrder")).default as any;
  const ChannelStockLedger = (await import("../src/models/ChannelStockLedger")).default as any;
  const connectDB = (await import("../src/connection")).default;
  await connectDB();
  const { syncChannelOrderStock, recordChannelOrderSource, setChannelOrderCancelled, repairChannelOrders, channelLedgerFaults } = ledger;
  const oid = () => new mongoose.Types.ObjectId();

  // Two products sharing one component (box), to catch token collisions
  const box = oid(), cap = oid(), sleeve = oid();
  const prodA = oid(), prodB = oid();
  const START = 1000;
  async function reset() {
    await mongoose.connection.db!.dropDatabase();
    await InventoryItem.collection.insertMany([
      { _id: box, name: "Box", currentStock: START, isActive: true },
      { _id: cap, name: "Cap", currentStock: START, isActive: true },
      { _id: sleeve, name: "Sleeve", currentStock: START, isActive: true },
    ]);
    await ProductConfig.collection.insertMany([
      { productId: prodA, productName: "A", isActive: true, components: [
        { inventoryItemId: box, inventoryItemName: "Box", quantity: 1 },
        { inventoryItemId: cap, inventoryItemName: "Cap", quantity: 2 } ] },
      { productId: prodB, productName: "B", isActive: true, components: [
        { inventoryItemId: box, inventoryItemName: "Box", quantity: 1 },
        { inventoryItemId: sleeve, inventoryItemName: "Sleeve", quantity: 1 } ] },
    ]);
  }
  async function stock() {
    const rows = await InventoryItem.find({}).lean();
    const m: Record<string, number> = {};
    for (const r of rows) m[r.name] = START - r.currentStock; // net cut
    return m;
  }
  let msgN = 0;
  async function newEvent(orderId: string, lines: Array<[any, number]>, extra: Record<string, unknown> = {}) {
    msgN += 1;
    const doc = {
      _id: oid(),
      gmailMessageId: `msg${msgN}`,
      channel: "amazon",
      eventType: "order",
      status: "pending_review",
      externalOrderId: orderId,
      subject: `Sold, ship now: ${lines.reduce((s, l) => s + l[1], 0)} items sold`,
      receivedAt: new Date(Date.now() + msgN),
      extracted: { expectedItemCount: lines.reduce((s, l) => s + l[1], 0) },
      matchedItems: lines.map(([p, q]) => ({ productId: p, productName: String(p) === String(prodA) ? "A" : "B", quantity: q, matchType: "sku" })),
      ...extra,
    };
    await ChannelOrderEvent.collection.insertOne(doc);
    return doc;
  }
  async function legacyTx(orderIdRaw: string, item: any, name: string, qty: number, type = "deduction") {
    await InventoryTransaction.collection.insertOne({ inventoryItemId: item, inventoryItemName: name, type, quantity: qty, orderId: `CH-${orderIdRaw}`, createdAt: new Date() });
    await InventoryItem.collection.updateOne({ _id: item }, { $inc: { currentStock: type === "deduction" ? -qty : qty } });
  }

  console.log("Channel ledger DB tests (in-memory MongoDB)");

  // G1/G2: double click, two admins, worker + admin -> exactly one cut
  await test("G2 concurrent apply x5 (admins + worker) cuts exactly once", async () => {
    await reset();
    const ev = await newEvent("408-1111111-1111111", [[prodA, 1], [prodB, 1]]);
    await Promise.all([
      sync.applyChannelEvent(String(ev._id), "admin1"),
      sync.applyChannelEvent(String(ev._id), "admin2"),
      sync.applyChannelEvent(String(ev._id), "admin1"),
      syncChannelOrderStock("408-1111111-1111111", { by: "worker" }),
      syncChannelOrderStock("408-1111111-1111111", { by: "worker" }),
    ]);
    // Shared component Box must be cut for BOTH products (token includes ledger key)
    assert.deepEqual(await stock(), { Box: 2, Cap: 2, Sleeve: 1 });
    const e = await ChannelOrderEvent.findById(ev._id).lean();
    assert.equal(e.status, "applied");
    // re-clicks after the fact: server no-op
    await sync.applyChannelEvent(String(ev._id), "admin1");
    const r = await syncChannelOrderStock("408-1111111-1111111");
    assert.equal(r.cut.length, 0);
    assert.deepEqual(await stock(), { Box: 2, Cap: 2, Sleeve: 1 });
  });

  await test("G2 concurrent raw syncs x10 on a new order -> one cut", async () => {
    await reset();
    const ev = await newEvent("408-2222222-2222222", [[prodA, 3]]);
    await recordChannelOrderSource(ev, [{ productId: String(prodA), productName: "A", quantity: 3 }], { trusted: true });
    const rs = await Promise.all(Array.from({ length: 10 }, () => syncChannelOrderStock("408-2222222-2222222", { waitMs: 20000 })));
    assert.equal(rs.filter((r) => r.cut.length).length, 1);
    assert.deepEqual(await stock(), { Box: 3, Cap: 6, Sleeve: 0 });
  });

  // G3: duplicates
  await test("G3 duplicate email / other message for the same order -> zero extra cut", async () => {
    await reset();
    const a = await newEvent("408-3333333-3333333", [[prodA, 1]]);
    const b = await newEvent("408 3333333 3333333", [[prodA, 1]]); // different message, un-normalised id
    const c = await newEvent("408-3333333-3333333", [[prodA, 1]], { gmailMessageId: a.gmailMessageId, _id: oid() }); // same message stored twice
    await Promise.all([sync.applyChannelEvent(String(a._id)), sync.applyChannelEvent(String(b._id)), sync.applyChannelEvent(String(c._id))]);
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
    const st = (await ChannelOrderEvent.find({}).lean()).map((e: any) => e.status).sort();
    assert.deepEqual(st, ["applied", "skipped", "skipped"]);
    // deterministic event _id per Gmail message -> a second insert of the same message is rejected
    const id = sync.eventIdForMessage("abcdef0123456789");
    assert.ok(id && String(id) === String(sync.eventIdForMessage("abcdef0123456789")));
  });

  // G4: re-check / cut missing on an order already cut once (email qty 1)
  await test("G4 cut again on an already-cut qty-1 order cuts nothing (ledger baseline)", async () => {
    await reset();
    const ev = await newEvent("408-4444444-4444444", [[prodA, 1]]);
    await sync.applyChannelEvent(String(ev._id));
    // what Cut missing now does: desired TOTAL from the email (1), never ledger + missing
    await ledger.setChannelOrderManualLines("408-4444444-4444444", [{ productId: String(prodA), productName: "A", quantity: 1 }]);
    const r = await syncChannelOrderStock("408-4444444-4444444");
    assert.equal(r.cut.length, 0);
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
  });

  await test("G4/G6 legacy order (old reason-id variants) is adopted with no cut; baseline = actual moves", async () => {
    await reset();
    const raw = "408-5555555-5555555";
    const ev = await newEvent(raw, [[prodA, 1]], { status: "applied" });
    await legacyTx(raw, box, "Box", 1);
    await legacyTx(`MSG-${String(ev.gmailMessageId).slice(-8)}`.replace(/^MSG-/, "MSG-"), cap, "Cap", 2); // CH-MSG-xxxx variant
    const before = await stock();
    const row = await ledger.buildRowForOrder(raw);
    assert.equal(row.action, "ok", JSON.stringify(row));
    const r = await syncChannelOrderStock(raw);
    assert.equal(r.status, "synced");
    assert.deepEqual(await stock(), before);
    const l = await ChannelStockLedger.findById(`${raw}|${prodA}`).lean();
    assert.equal(l.quantity, 1);
    // and a duplicate email afterwards cuts nothing
    const dup = await newEvent(raw, [[prodA, 1]]);
    await sync.applyChannelEvent(String(dup._id));
    assert.deepEqual(await stock(), before);
  });

  await test("G6 legacy DOUBLE cut: sync refuses (needs_repair); only confirmed repair returns the extra", async () => {
    await reset();
    const raw = "408-6666666-6666666";
    await newEvent(raw, [[prodA, 1]], { status: "applied" });
    await newEvent(raw, [[prodA, 1]], { status: "applied" });
    for (let i = 0; i < 2; i++) { await legacyTx(raw, box, "Box", 1); await legacyTx(raw, cap, "Cap", 2); }
    assert.deepEqual(await stock(), { Box: 2, Cap: 4, Sleeve: 0 });
    const r = await syncChannelOrderStock(raw);
    assert.equal(r.status, "needs_repair");
    const dry = await repairChannelOrders({});
    assert.equal(dry.summary.toFix, 1);
    assert.deepEqual(await stock(), { Box: 2, Cap: 4, Sleeve: 0 }, "dry run writes nothing");
    await assert.rejects(repairChannelOrders({ apply: true, orderIds: [raw] }), /confirm/);
    await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: [raw] });
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
    const again = await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: [raw] });
    assert.equal(again.summary.toFix, 0);
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
    const dups = await ChannelOrderEvent.countDocuments({ duplicateOf: { $exists: true } });
    assert.equal(dups, 1);
    assert.equal((await syncChannelOrderStock(raw)).cut.length, 0);
  });

  await test("G6 legacy UNDER cut: corrected only after confirm", async () => {
    await reset();
    const raw = "408-6767676-6767676";
    await newEvent(raw, [[prodA, 1], [prodB, 1]], { status: "applied" });
    await legacyTx(raw, box, "Box", 1); await legacyTx(raw, cap, "Cap", 2); // B never cut
    assert.equal((await syncChannelOrderStock(raw)).status, "needs_repair");
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
    await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: [raw] });
    assert.deepEqual(await stock(), { Box: 2, Cap: 2, Sleeve: 1 });
  });

  // G5: crash safety
  await test("G5 crash between stock write and log/ledger write, then re-run -> exact", async () => {
    await reset();
    const key = "408-7777777-7777777";
    const ev = await newEvent(key, [[prodA, 2], [prodB, 1]]);
    let n = 0;
    channelLedgerFaults.afterStockWrite = () => { if (++n === 2) throw new Error("simulated crash"); };
    const r1 = await syncChannelOrderStock(key).catch((e) => e);
    void r1;
    await recordChannelOrderSource(ev, [{ productId: String(prodA), productName: "A", quantity: 2 }, { productId: String(prodB), productName: "B", quantity: 1 }], { trusted: true });
    n = 0;
    const r2 = await syncChannelOrderStock(key);
    assert.equal(r2.status, "error"); // crashed mid-op
    channelLedgerFaults.afterStockWrite = undefined;
    // stale lock left behind as a real crash would (simulate expiry)
    await ChannelOrder.updateOne({ _id: key }, { $set: { syncLockAt: new Date(Date.now() - 11 * 60 * 1000) } });
    await syncChannelOrderStock(key);
    await syncChannelOrderStock(key);
    assert.deepEqual(await stock(), { Box: 3, Cap: 4, Sleeve: 1 });
    // every stock move has exactly one log row
    const txs = await InventoryTransaction.find({ orderId: `CH-${key}` }).lean();
    const net = txs.reduce((s: number, t: any) => s + t.quantity, 0);
    assert.equal(net, 3 + 4 + 1);
  });

  await test("G5 crash after moves but before ledger commit -> replay, no double", async () => {
    await reset();
    const key = "408-8888888-8888888";
    const ev = await newEvent(key, [[prodA, 1]]);
    await recordChannelOrderSource(ev, [{ productId: String(prodA), productName: "A", quantity: 1 }], { trusted: true });
    channelLedgerFaults.afterMoves = () => { throw new Error("crash before ledger commit"); };
    await syncChannelOrderStock(key);
    channelLedgerFaults.afterMoves = undefined;
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
    const l = await ChannelStockLedger.findById(`${key}|${prodA}`).lean();
    assert.ok(l.pending, "pending marker survives the crash");
    await syncChannelOrderStock(key);
    await syncChannelOrderStock(key);
    assert.deepEqual(await stock(), { Box: 1, Cap: 2, Sleeve: 0 });
    assert.equal((await ChannelStockLedger.findById(`${key}|${prodA}`).lean()).quantity, 1);
  });

  await test("G5 bulk repair throws after N orders / crashes mid-order, re-run ends exact", async () => {
    await reset();
    const keys: string[] = [];
    for (let i = 0; i < 5; i++) {
      const k = `408-900000${i}-9000000`;
      keys.push(k);
      await newEvent(k, [[prodA, 1]], { status: "applied" });
      await newEvent(k, [[prodA, 1]], { status: "applied" });
      for (let j = 0; j < 2; j++) { await legacyTx(k, box, "Box", 1); await legacyTx(k, cap, "Cap", 2); }
    }
    assert.deepEqual(await stock(), { Box: 10, Cap: 20, Sleeve: 0 });
    let orders = 0, writes = 0;
    channelLedgerFaults.afterMoves = () => { if (++orders === 3) throw new Error("process killed"); };
    await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: keys });
    channelLedgerFaults.afterMoves = undefined;
    channelLedgerFaults.afterStockWrite = () => { if (++writes === 1) throw new Error("killed between $inc and log"); };
    await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: keys });
    channelLedgerFaults.afterStockWrite = undefined;
    await ChannelOrder.updateMany({}, { $set: { syncLockAt: null } });
    await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: keys });
    await repairChannelOrders({ apply: true, confirm: "REPAIR", orderIds: keys });
    assert.deepEqual(await stock(), { Box: 5, Cap: 10, Sleeve: 0 });
    for (const k of keys) assert.equal((await syncChannelOrderStock(k)).cut.length, 0);
    assert.deepEqual(await stock(), { Box: 5, Cap: 10, Sleeve: 0 });
    const dry = await repairChannelOrders({ orderIds: keys });
    assert.equal(dry.summary.toFix, 0);
  });

  // G8: cancel restores exactly the ledger (new + legacy), twice = once
  await test("G8 cancel restores exactly what the ledger cut; duplicate cancel returns nothing", async () => {
    await reset();
    const key = "408-1212121-1212121";
    const ev = await newEvent(key, [[prodA, 2], [prodB, 1]]);
    await sync.applyChannelEvent(String(ev._id));
    assert.deepEqual(await stock(), { Box: 3, Cap: 4, Sleeve: 1 });
    const c1 = { _id: oid(), gmailMessageId: "cx1", eventType: "cancel", status: "pending_review", externalOrderId: key, channel: "amazon", receivedAt: new Date() };
    const c2 = { ...c1, _id: oid(), gmailMessageId: "cx2" };
    await ChannelOrderEvent.collection.insertMany([c1, c2]);
    await Promise.all([sync.applyChannelEvent(String(c1._id)), sync.applyChannelEvent(String(c2._id))]);
    assert.deepEqual(await stock(), { Box: 0, Cap: 0, Sleeve: 0 });
  });

  await test("G8 cancel of a legacy (old-code) order returns exactly the actual cut", async () => {
    await reset();
    const raw = "408-1313131-1313131";
    await newEvent(raw, [[prodA, 1]], { status: "applied" });
    await legacyTx(raw, box, "Box", 1); await legacyTx(raw, cap, "Cap", 2);
    await setChannelOrderCancelled(raw, true);
    const r = await syncChannelOrderStock(raw);
    assert.equal(r.status, "synced", r.note);
    assert.deepEqual(await stock(), { Box: 0, Cap: 0, Sleeve: 0 });
    assert.equal((await syncChannelOrderStock(raw)).restored.length, 0);
    assert.deepEqual(await stock(), { Box: 0, Cap: 0, Sleeve: 0 });
  });

  await test("G1 retired direct deduct/restore functions refuse to move stock", async () => {
    const inv = await import("../src/services/channel-inventory");
    await assert.rejects(inv.deductInventoryForChannelItems([{ productId: String(prodA), productName: "A", quantity: 1 } as any], "CH-x"), /retired/);
    await assert.rejects(inv.restoreInventoryFromChannelSnapshot([{ inventoryItemId: String(box), inventoryItemName: "Box", quantity: 1 } as any], "CH-x"), /retired/);
  });

  console.log(`\n${passed} DB tests passed`);
  await mongoose.disconnect();
  await mms.stop();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
