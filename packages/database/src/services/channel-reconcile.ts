/**
 * Pure (DB-free) reconciliation of "what the email says" vs "what stock was actually cut"
 * for one marketplace order. Used by Re-check items, Cut missing and the one-time backfill.
 */

export type ReconcileWanted = { productId: string; productName: string; quantity: number };
export type BomLine = { inventoryItemId: string; quantity: number };
export type ReconcileTx = { inventoryItemId: unknown; type: string; quantity: number };

export type ReconcileLine = {
  productId: string;
  productName: string;
  /** units the email says were sold */
  expectedQty: number;
  /** units actually cut for this order */
  cutQty: number;
  /** expected - cut (never negative) */
  missingQty: number;
  /** cut beyond what the email says (possible double deduction) */
  extraQty: number;
  /** "inventory" = from InventoryTransaction rows; "recorded" = from locks / event rows */
  source: "inventory" | "recorded";
};

/** Net units cut per inventory item (deductions minus restores) from transaction rows. */
export function netCutByComponent(txs: ReconcileTx[]): Map<string, number> {
  const net = new Map<string, number>();
  for (const tx of txs || []) {
    const id = String(tx.inventoryItemId || "");
    if (!id) continue;
    const q = Number(tx.quantity) || 0;
    const sign = tx.type === "deduction" ? 1 : tx.type === "addition" ? -1 : 0;
    if (!sign) continue;
    net.set(id, (net.get(id) || 0) + sign * q);
  }
  return net;
}

/** Merge wanted lines by product id (qty summed). */
export function mergeWanted(lines: ReconcileWanted[]): ReconcileWanted[] {
  const map = new Map<string, ReconcileWanted>();
  for (const l of lines || []) {
    const id = String(l.productId || "");
    if (!id) continue;
    const q = Math.max(1, Math.floor(Number(l.quantity) || 1));
    const prev = map.get(id);
    if (prev) prev.quantity += q;
    else map.set(id, { productId: id, productName: l.productName, quantity: q });
  }
  return [...map.values()];
}

function unitsAvailable(pool: Map<string, number>, bom: BomLine[]): number {
  let units = Infinity;
  for (const c of bom) {
    const per = Number(c.quantity) || 0;
    if (per <= 0) continue;
    units = Math.min(units, Math.floor((pool.get(String(c.inventoryItemId)) || 0) / per));
  }
  return Number.isFinite(units) ? Math.max(0, units) : 0;
}

function take(pool: Map<string, number>, bom: BomLine[], units: number) {
  for (const c of bom) {
    const id = String(c.inventoryItemId);
    pool.set(id, (pool.get(id) || 0) - units * (Number(c.quantity) || 0));
  }
}

/**
 * Per product: expected vs actually cut.
 * When inventory transactions exist for the order they are the truth (component pool is
 * allocated to products by BOM); otherwise fall back to recorded per-product quantities.
 * `others` = products recorded as cut for this order but not listed in the email.
 */
export function reconcileOrder(input: {
  wanted: ReconcileWanted[];
  others?: Array<{ productId: string; productName: string }>;
  recorded: Map<string, number>;
  boms: Record<string, BomLine[]>;
  netCut: Map<string, number> | null;
}): { lines: ReconcileLine[]; unexplained: Array<{ inventoryItemId: string; quantity: number }> } {
  const wanted = mergeWanted(input.wanted);
  const seen = new Set(wanted.map((w) => w.productId));
  const all: ReconcileWanted[] = [
    ...wanted,
    ...(input.others || [])
      .filter((o) => o.productId && !seen.has(String(o.productId)))
      .map((o) => ({ productId: String(o.productId), productName: o.productName, quantity: 0 })),
  ];
  const useInventory = !!input.netCut && input.netCut.size > 0;
  const pool = new Map(input.netCut || []);
  const cut = new Map<string, number>();
  const source = new Map<string, "inventory" | "recorded">();

  for (const w of all) {
    const bom = input.boms[w.productId] || [];
    if (!useInventory || !bom.length) {
      cut.set(w.productId, Math.max(0, input.recorded.get(w.productId) || 0));
      source.set(w.productId, "recorded");
      continue;
    }
    const units = Math.min(unitsAvailable(pool, bom), w.quantity);
    take(pool, bom, units);
    cut.set(w.productId, units);
    source.set(w.productId, "inventory");
  }
  // Second pass: anything still in the pool that forms whole product units = over-cut
  if (useInventory) {
    for (const w of all) {
      const bom = input.boms[w.productId] || [];
      if (source.get(w.productId) !== "inventory") continue;
      const extra = unitsAvailable(pool, bom);
      if (extra > 0) {
        take(pool, bom, extra);
        cut.set(w.productId, (cut.get(w.productId) || 0) + extra);
      }
    }
  }

  const lines = all.map((w) => {
    const c = cut.get(w.productId) || 0;
    return {
      productId: w.productId,
      productName: w.productName,
      expectedQty: w.quantity,
      cutQty: c,
      missingQty: Math.max(0, w.quantity - c),
      extraQty: Math.max(0, c - w.quantity),
      source: source.get(w.productId) || "recorded",
    } as ReconcileLine;
  });
  const unexplained = useInventory
    ? [...pool].filter(([, q]) => q > 0).map(([inventoryItemId, quantity]) => ({ inventoryItemId, quantity }))
    : [];
  return { lines, unexplained };
}

/** Pure: case-insensitive, trimmed exact SKU compare (no prefix guessing). */
export function skuEquals(a: unknown, b: unknown): boolean {
  const x = String(a || "").trim().toUpperCase();
  return !!x && x === String(b || "").trim().toUpperCase();
}
