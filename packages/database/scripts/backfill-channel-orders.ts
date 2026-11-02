/**
 * One-time repair of channel (Amazon email) orders - same logic as the admin "Backfill / Repair" button.
 * Works per ORDER across all its emails: expected component cuts (all emails merged, MAX per product)
 * vs actual InventoryTransaction rows under every reason id of the order.
 *
 * Dry run (default, NO writes):
 *   npx tsx packages/database/scripts/backfill-channel-orders.ts [--since 2026-10-01] [--json report.json]
 * Apply (returns over-cut, cuts under-cut, seeds the ledger, marks duplicate emails):
 *   npx tsx packages/database/scripts/backfill-channel-orders.ts --apply --confirm REPAIR --orders 405-9711223-6892306,402-...
 *   (or --orders-from report.json to apply every "cut"/"ok" row of a saved dry run)
 * Needs MONGODB_URI. Idempotent: a second apply finds nothing to change.
 */
import fs from "node:fs";
import mongoose from "mongoose";
import { backfillChannelOrders } from "../src/services/channel-email-sync";

function arg(name: string) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const since = arg("--since") ? new Date(String(arg("--since"))) : null;
  let orderIds = (arg("--orders") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const from = arg("--orders-from");
  if (from) {
    const saved = JSON.parse(fs.readFileSync(from, "utf8"));
    orderIds = (saved.rows || []).filter((r: any) => r.action !== "review").map((r: any) => r.orderId);
  }
  const result = await backfillChannelOrders({ apply, confirm: arg("--confirm"), orderIds, since, by: "repair-script" });
  for (const r of result.rows) {
    if (r.action === "ok" && !apply) continue;
    console.log(
      `[${r.action}] ${r.orderId} | emails ${r.emails} (dup ${r.duplicates}) | should be: ${(r.desired || []).map((d) => `${d.productName} x${d.quantity}`).join(", ") || "-"}` +
        (r.missing.length ? ` | CUT: ${r.missing.map((m) => `${m.productName} x${m.quantity}`).join(", ")}` : "") +
        (r.overCut.length ? ` | RETURN: ${r.overCut.map((m) => `${m.productName} x${m.quantity}`).join(", ")}` : "") +
        (r.blockers.length ? ` | ${r.blockers.join("; ")}` : "") +
        (r.result ? ` | ${r.result}` : "")
    );
  }
  console.log(JSON.stringify(result.summary));
  const out = arg("--json");
  if (out) fs.writeFileSync(out, JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
