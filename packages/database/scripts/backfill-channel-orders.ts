/**
 * One-time backfill of old applied Amazon orders (same logic as the admin "Backfill old orders" button).
 * Dry run (default, no writes):  npx tsx packages/database/scripts/backfill-channel-orders.ts
 * Apply missing cuts only:       npx tsx packages/database/scripts/backfill-channel-orders.ts --apply
 * Needs MONGODB_URI. Safe to re-run: locks + backfilledAt make it a no-op the second time.
 */
import mongoose from "mongoose";
import { backfillChannelOrders } from "../src/services/channel-email-sync";

async function main() {
  const apply = process.argv.includes("--apply");
  const { summary, rows } = await backfillChannelOrders({ apply, by: "backfill-script" });
  for (const r of rows) {
    if (r.action === "ok" && !apply) continue;
    console.log(
      `[${r.action}] ${r.orderId || r.eventId} | missing: ${r.missing.map((m) => `${m.productName} x${m.quantity}`).join(", ") || "-"}` +
        (r.overCut.length ? ` | OVER-CUT: ${r.overCut.map((m) => `${m.productName} x${m.quantity}`).join(", ")}` : "") +
        (r.blockers.length ? ` | ${r.blockers.join("; ")}` : "") +
        (r.result ? ` | ${r.result}` : "")
    );
  }
  console.log(JSON.stringify(summary));
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
