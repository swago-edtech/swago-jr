/** Combo metadata used for analytics unit multipliers (not stock). */
export type ComboProductMeta = {
  isCombo?: boolean;
  comboUnitCount?: number;
};

/**
 * Physical units for analytics: quantity * comboUnitCount when isCombo.
 * Revenue and order counts stay 1:1 with the order line.
 */
export function effectiveUnits(
  quantity: number,
  product?: ComboProductMeta | null
): number {
  const qty = quantity || 0;
  if (!product?.isCombo) return qty;
  const n = Math.max(1, Number(product.comboUnitCount) || 1);
  return qty * n;
}

export type ParsedComboFields = {
  isCombo: boolean;
  comboUnitCount: number;
  comboProductIds: string[];
};

/**
 * Normalize + validate combo fields from a product create/update body.
 * Returns an error message string on failure, or the parsed fields.
 */
export function parseComboFields(body: {
  isCombo?: unknown;
  comboUnitCount?: unknown;
  comboProductIds?: unknown;
}): { ok: true; fields: ParsedComboFields } | { ok: false; error: string } {
  const isCombo = Boolean(body.isCombo);

  if (!isCombo) {
    return {
      ok: true,
      fields: { isCombo: false, comboUnitCount: 1, comboProductIds: [] },
    };
  }

  const rawCount = Number(body.comboUnitCount);
  if (!Number.isInteger(rawCount) || rawCount < 2) {
    return {
      ok: false,
      error: "Combo products require units per combo (integer ≥ 2)",
    };
  }

  const ids = Array.isArray(body.comboProductIds)
    ? body.comboProductIds.map(String).filter(Boolean)
    : [];

  return {
    ok: true,
    fields: {
      isCombo: true,
      comboUnitCount: rawCount,
      comboProductIds: ids,
    },
  };
}

/** Prefer combo / multi-product names over Seek Rush / Scarf bucketing. */
export function normalizeProductNameForAnalytics(name: string): string {
  if (!name) return "Unknown Product";
  const lower = name.toLowerCase();
  const isComboLike =
    lower.includes("combo") ||
    (lower.includes("seek") &&
      (lower.includes("scarf") ||
        lower.includes("charade") ||
        lower.includes("chardaes")));
  if (isComboLike) {
    if (lower.includes("combo")) return "SWAGO Combo";
    return name.trim();
  }
  if (lower.includes("seek rush")) return "Seek Rush";
  if (
    lower.includes("scarf") ||
    lower.includes("charades") ||
    lower.includes("chardaes")
  ) {
    return "Scarf Dumb Charades";
  }
  return name;
}
