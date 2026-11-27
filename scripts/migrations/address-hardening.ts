/**
 * scripts/migrations/address-hardening.ts
 *
 * One-off maintenance for the address-based pricing change. DRY-RUN BY DEFAULT:
 * nothing is written to the database unless `--apply` is passed (and
 * `report-abuse` never writes to the DB at all).
 *
 *   npx tsx scripts/migrations/address-hardening.ts report-abuse   [--out=abuse.csv] [--since=2025-01-01]
 *   npx tsx scripts/migrations/address-hardening.ts backfill-state-codes      [--apply] [--limit=N]
 *   npx tsx scripts/migrations/address-hardening.ts convert-promotion-states  [--apply]
 *
 * Connection: MONGODB_ADMIN_URI (same variable as the other migrations), loaded
 * from the environment / .env.local. The URI is never printed.
 *
 * report-abuse            CSV of orders whose charged country (old IP/VPN-derived) differs
 *                         from the country their address actually belongs to, or whose
 *                         address fails today's validation. Read-only.
 * backfill-state-codes    Sets Order.stateCode from the legacy state name when it maps
 *                         unambiguously and the order has no stateCode yet. Only writes
 *                         `stateCode` (+ `addressDataVersion` if missing).
 * convert-promotion-states  Converts Promotion.blockedCodStates from names to ISO codes
 *                         (e.g. "Maharashtra" → "IN-MH"); unknown entries are reported and kept out.
 */
import { writeFileSync } from "node:fs";
import {
  ADDRESS_DATA_VERSION,
  findSubdivisionLegacy,
  getSubdivision,
  validateAddress,
  type AddressCountryCode,
} from "../../packages/utils/src/address-server";

// ------------------------------------------------------------------ pure helpers (unit-tested)

export interface LegacyOrder {
  _id: unknown;
  orderId?: string;
  createdAt?: Date | string;
  status?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  currency?: string;
  total?: number;
  displayTotal?: number;
  phone?: string;
  paymentMethod?: string;
}

export interface AbuseRow {
  id: string;
  orderId: string;
  createdAt: string;
  status: string;
  chargedCountry: string;
  chargedCurrency: string;
  addressCountry: string;
  stateCode: string;
  pincode: string;
  totalInr: number;
  reasons: string[];
}

/** Classify one historical order. Returns null when nothing looks wrong. */
export function classifyOrder(o: LegacyOrder): AbuseRow | null {
  const charged = String(o.country || "IN").toUpperCase();
  const sub = o.stateCode ? getSubdivision(o.stateCode) : findSubdivisionLegacy(o.state || "");
  const reasons: string[] = [];
  let addressCountry = sub?.country || "";

  if (!sub) {
    reasons.push("STATE_UNRECOGNISED");
  } else {
    const v = validateAddress({
      address: o.address || "x",
      city: o.city,
      stateCode: sub.code,
      postalCode: o.pincode,
      phone: o.phone,
    });
    if (!v.ok) reasons.push(...v.errors.map((e) => e.code));
    if (v.flags.length) reasons.push(...v.flags.map((f) => `flag:${f}`));
  }
  // Old checkout only offered Indian states, so a foreign customer typed into Indian
  // fields: the strongest signal is a non-Indian phone with an "Indian" address, or an
  // international charge (IP) against an Indian address and vice versa.
  if (addressCountry && addressCountry !== charged) reasons.push(`COUNTRY_MISMATCH:${charged}->${addressCountry}`);
  if (o.phone && !/^\+?91[6-9]\d{9}$/.test(String(o.phone).replace(/[\s-]/g, "")) && addressCountry === "IN") {
    reasons.push("NON_INDIAN_PHONE_INDIAN_ADDRESS");
  }
  if (!addressCountry) addressCountry = "?";
  if (reasons.length === 0) return null;
  return {
    id: String(o._id),
    orderId: o.orderId || "",
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : "",
    status: o.status || "",
    chargedCountry: charged,
    chargedCurrency: String(o.currency || "INR"),
    addressCountry,
    stateCode: sub?.code || "",
    pincode: o.pincode || "",
    totalInr: Number(o.total) || 0,
    reasons,
  };
}

export function toCsv(rows: AbuseRow[]): string {
  const head = ["id", "orderId", "createdAt", "status", "chargedCountry", "chargedCurrency", "addressCountry", "stateCode", "pincode", "totalInr", "reasons"];
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    // Neutralise spreadsheet formula injection and quote everything.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [head.join(","), ...rows.map((r) => head.map((k) => esc(k === "reasons" ? r.reasons.join(" ") : (r as any)[k])).join(","))].join("\n") + "\n";
}

export type BackfillPlan = { action: "set"; stateCode: string } | { action: "skip"; reason: string };

export function planStateCodeBackfill(o: LegacyOrder): BackfillPlan {
  if (o.stateCode) return { action: "skip", reason: "already-set" };
  const country = String(o.country || "IN").toUpperCase() as AddressCountryCode;
  const sub = findSubdivisionLegacy(o.state || "", ["IN", "US", "CA", "AE"].includes(country) ? country : undefined);
  if (!sub) return { action: "skip", reason: "unmapped-state" };
  return { action: "set", stateCode: sub.code };
}

export function convertPromotionStates(values: unknown): { codes: string[]; unknown: string[] } {
  const codes: string[] = [];
  const unknown: string[] = [];
  for (const v of Array.isArray(values) ? values : []) {
    const sub = findSubdivisionLegacy(String(v), "IN");
    if (sub) {
      if (!codes.includes(sub.code)) codes.push(sub.code);
    } else unknown.push(String(v));
  }
  return { codes, unknown };
}

// ------------------------------------------------------------------ DB runner

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

async function main() {
  const cmd = process.argv[2];
  if (!["report-abuse", "backfill-state-codes", "convert-promotion-states"].includes(cmd || "")) {
    console.error("Usage: address-hardening.ts <report-abuse|backfill-state-codes|convert-promotion-states> [--apply]");
    process.exit(2);
  }
  const apply = arg("apply") === "true" && cmd !== "report-abuse";
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env.local" });
  const uri = process.env.MONGODB_ADMIN_URI;
  if (!uri) throw new Error("MONGODB_ADMIN_URI is not set");
  const mongoose = (await import("mongoose")).default;
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  console.log(`[${cmd}] connected (${apply ? "APPLY — writes enabled" : "DRY RUN — no writes"})`);

  try {
    if (cmd === "report-abuse") {
      const since = arg("since");
      const q: Record<string, unknown> = since ? { createdAt: { $gte: new Date(since) } } : {};
      const rows: AbuseRow[] = [];
      let scanned = 0;
      for await (const o of db.collection("orders").find(q, {
        projection: { orderId: 1, createdAt: 1, status: 1, address: 1, city: 1, state: 1, stateCode: 1, pincode: 1, country: 1, currency: 1, total: 1, phone: 1 },
      })) {
        scanned++;
        const r = classifyOrder(o as unknown as LegacyOrder);
        if (r) rows.push(r);
      }
      const out = arg("out") || `address-abuse-report-${new Date().toISOString().slice(0, 10)}.csv`;
      writeFileSync(out, toCsv(rows));
      console.log(`scanned ${scanned} orders, ${rows.length} flagged → ${out}`);
    } else if (cmd === "backfill-state-codes") {
      const limit = Number(arg("limit") || 0);
      const cursor = db.collection("orders").find({ $or: [{ stateCode: { $exists: false } }, { stateCode: "" }] }, { projection: { state: 1, country: 1, stateCode: 1, addressDataVersion: 1 } });
      if (limit > 0) cursor.limit(limit);
      const tally: Record<string, number> = {};
      for await (const o of cursor) {
        const plan = planStateCodeBackfill(o as unknown as LegacyOrder);
        const key = plan.action === "set" ? `set:${plan.stateCode}` : `skip:${plan.reason}`;
        tally[key] = (tally[key] || 0) + 1;
        if (plan.action === "set" && apply) {
          await db.collection("orders").updateOne(
            { _id: o._id, $or: [{ stateCode: { $exists: false } }, { stateCode: "" }] },
            { $set: { stateCode: plan.stateCode, ...(o.addressDataVersion ? {} : { addressDataVersion: `backfill:${ADDRESS_DATA_VERSION}` }) } }
          );
        }
      }
      console.table(tally);
    } else {
      const promos = await db.collection("promotions").find({}, { projection: { blockedCodStates: 1 } }).toArray();
      for (const p of promos) {
        const { codes, unknown } = convertPromotionStates(p.blockedCodStates);
        console.log(`promotion ${p._id}: ${JSON.stringify(p.blockedCodStates)} → ${JSON.stringify(codes)}${unknown.length ? ` (UNKNOWN, dropped: ${JSON.stringify(unknown)})` : ""}`);
        if (apply) await db.collection("promotions").updateOne({ _id: p._id }, { $set: { blockedCodStates: codes } });
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

// Only run when executed directly (tests import the helpers).
if (process.argv[1] && /address-hardening\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
