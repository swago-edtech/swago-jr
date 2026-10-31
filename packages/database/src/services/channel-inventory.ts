import mongoose from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import InventoryItem from "../models/InventoryItem";
import InventoryTransaction from "../models/InventoryTransaction";
import ProductConfig from "../models/ProductConfig";
import { InsufficientInventoryError } from "./inventory-order";
import { syncAffectedProducts } from "./inventory-sync";

export type ChannelMatchedItem = {
  productId: string;
  productName: string;
  quantity: number;
  extractedTitle?: string;
  matchType?: string;
};

export type ChannelSnapshotLine = {
  inventoryItemId: mongoose.Types.ObjectId;
  inventoryItemName: string;
  quantity: number;
};

type ProductLean = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
  shortForms?: string[];
  amazonSku?: string;
};

function normalizeTitle(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const TITLE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "kids",
  "teens",
  "adults",
  "ages",
  "gift",
  "boys",
  "girls",
  "family",
  "party",
  "game",
  "night",
  "players",
  "educational",
  "brain",
  "training",
  "focus",
  "memory",
  "board",
  "paced",
  "fast",
  "swago",
]);

/** True when catalog product name is clearly contained in a long Amazon listing title. */
function titleLooksLikeProduct(productName: string, amazonTitle: string): boolean {
  const productNorm = normalizeTitle(productName);
  const titleNorm = normalizeTitle(amazonTitle);
  if (!productNorm || !titleNorm) return false;
  if (titleNorm.includes(productNorm) || productNorm.includes(titleNorm)) return true;

  const tokens = productNorm
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !TITLE_STOP_WORDS.has(t));
  if (tokens.length < 2) return tokens.length === 1 && titleNorm.includes(tokens[0]);
  return tokens.every((t) => titleNorm.includes(t));
}

/**
 * Try to match an item to a Swago product using an inventory-item SKU.
 * Deterministic: only active products; prefers the product whose BOM is exactly that
 * item, then one whose name equals the item name. A SKU used as a shared component in
 * several products is treated as ambiguous (null) instead of picking an arbitrary one.
 */
async function matchBySku(
  sku: string,
  products: ProductLean[]
): Promise<{ productId: string; productName: string } | null> {
  const cleaned = String(sku || "")
    .trim()
    .toUpperCase()
    .replace(/^SKU[:\s]+/i, "");
  if (!cleaned) return null;

  const invItems = (await InventoryItem.find({
    sku: { $regex: `^${cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  })
    .select("_id name sku")
    .sort({ _id: 1 })
    .lean()) as unknown as Array<{ _id: mongoose.Types.ObjectId; name: string; sku?: string }>;
  if (!invItems.length) return null;

  const activeById = new Map(products.map((p) => [p._id.toString(), p]));
  const invIds = invItems.map((i) => i._id);
  const invIdSet = new Set(invIds.map((id) => id.toString()));
  const invNames = new Set(invItems.map((i) => normalizeTitle(i.name)));

  const configs = (await ProductConfig.find({
    "components.inventoryItemId": { $in: invIds },
    isActive: true,
  })
    .select("productId productName components")
    .sort({ _id: 1 })
    .lean()) as unknown as Array<{
    productId: mongoose.Types.ObjectId;
    productName?: string;
    components?: Array<{ inventoryItemId: mongoose.Types.ObjectId }>;
  }>;

  const candidates = configs
    .map((c) => ({ config: c, product: activeById.get(String(c.productId)) }))
    .filter((c): c is { config: (typeof configs)[number]; product: ProductLean } => !!c.product);

  // Deduplicate by product
  const byProduct = new Map<string, (typeof candidates)[number]>();
  for (const c of candidates) {
    const id = c.product._id.toString();
    if (!byProduct.has(id)) byProduct.set(id, c);
  }
  const unique = [...byProduct.values()];
  const pick = (c: (typeof unique)[number]) => ({
    productId: c.product._id.toString(),
    productName: c.product.name || c.config.productName || "",
  });

  if (unique.length === 1) return pick(unique[0]);
  if (unique.length > 1) {
    const dedicated = unique.filter(
      (c) =>
        (c.config.components || []).length > 0 &&
        (c.config.components || []).every((comp) => invIdSet.has(String(comp.inventoryItemId)))
    );
    if (dedicated.length === 1) return pick(dedicated[0]);
    const named = unique.filter((c) => invNames.has(normalizeTitle(c.product.name)));
    if (named.length === 1) return pick(named[0]);
    // Shared component across several products: ambiguous, let admin confirm
    return null;
  }

  // Fall back to a direct product name match on the inventory item name
  const byName = products.filter((p) => invNames.has(normalizeTitle(p.name)));
  if (byName.length === 1) {
    return { productId: byName[0]._id.toString(), productName: byName[0].name };
  }

  return null;
}
export async function matchChannelProducts(
  extractedItems: Array<{ title?: string; quantity?: number; sku?: string }>,
  aliases: Array<{ alias: string; productId: { toString(): string }; productName?: string }>
): Promise<{ matched: ChannelMatchedItem[]; unmatched: string[] }> {
  await connectDB();

  const products = (await Product.find({ isActive: true })
    .select("_id name slug shortForms amazonSku")
    .sort({ _id: 1 })
    .lean()) as unknown as ProductLean[];

  const matched: ChannelMatchedItem[] = [];
  const unmatched: string[] = [];

  for (const item of extractedItems) {
    const title = item.title || "";
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const normalized = normalizeTitle(title);
    const skuClean = String(item.sku || "")
      .trim()
      .toUpperCase()
      .replace(/^SKU[:\s]+/i, "");

    // First try matching by SKU if available
    if (skuClean) {
      // 1) Exact product-level Amazon SKU (set on product edit page) wins
      const byAmazonSku = products.filter(
        (p) => String(p.amazonSku || "").trim().toUpperCase() === skuClean
      );
      if (byAmazonSku.length === 1) {
        matched.push({
          productId: byAmazonSku[0]._id.toString(),
          productName: byAmazonSku[0].name,
          quantity,
          extractedTitle: title,
          matchType: "amazonSku",
        });
        continue;
      }

      // 2) Inventory-item SKU -> product BOM (deterministic, ambiguity-safe)
      const skuMatch = byAmazonSku.length > 1 ? null : await matchBySku(skuClean, products);
      if (skuMatch) {
        matched.push({
          productId: skuMatch.productId,
          productName: skuMatch.productName,
          quantity,
          extractedTitle: title,
          matchType: "sku",
        });
        continue;
      }

      // Alias keyed by marketplace SKU
      const skuAlias = aliases.find((a) => normalizeTitle(a.alias) === normalizeTitle(skuClean));
      if (skuAlias) {
        const product = products.find((p) => p._id.toString() === skuAlias.productId.toString());
        matched.push({
          productId: skuAlias.productId.toString(),
          productName: product?.name || skuAlias.productName || title,
          quantity,
          extractedTitle: title,
          matchType: "alias",
        });
        continue;
      }

      // Lottery short-forms sometimes mirror a SKU segment (e.g. SSR)
      const skuParts = skuClean.split("-").filter((part) => part.length >= 3);
      const byShortForm = products.find((p) =>
        (p.shortForms || []).some((form) => {
          const f = normalizeTitle(form);
          return f === normalizeTitle(skuClean) || skuParts.some((part) => normalizeTitle(part) === f);
        })
      );
      if (byShortForm) {
        matched.push({
          productId: byShortForm._id.toString(),
          productName: byShortForm.name,
          quantity,
          extractedTitle: title,
          matchType: "shortForm",
        });
        continue;
      }
    }

    if (!normalized) {
      unmatched.push(title || "(empty title)");
      continue;
    }

    const alias = aliases.find((a) => normalizeTitle(a.alias) === normalized);
    if (alias) {
      const product = products.find((p) => p._id.toString() === alias.productId.toString());
      matched.push({
        productId: alias.productId.toString(),
        productName: product?.name || alias.productName || title,
        quantity,
        extractedTitle: title,
        matchType: "alias",
      });
      continue;
    }

    const exact = products.find((p) => normalizeTitle(p.name) === normalized);
    if (exact) {
      matched.push({
        productId: exact._id.toString(),
        productName: exact.name,
        quantity,
        extractedTitle: title,
        matchType: "exact",
      });
      continue;
    }

    const slugMatch = products.find((p) => p.slug && normalizeTitle(p.slug) === normalized);
    if (slugMatch) {
      matched.push({
        productId: slugMatch._id.toString(),
        productName: slugMatch.name,
        quantity,
        extractedTitle: title,
        matchType: "slug",
      });
      continue;
    }

    const shortForm = products.find((p) =>
      (p.shortForms || []).some((form: string) => normalizeTitle(form) === normalized)
    );
    if (shortForm) {
      matched.push({
        productId: shortForm._id.toString(),
        productName: shortForm.name,
        quantity,
        extractedTitle: title,
        matchType: "shortForm",
      });
      continue;
    }

    const contains = products.filter((p) => {
      const name = normalizeTitle(p.name);
      return name.includes(normalized) || normalized.includes(name);
    });
    if (contains.length === 1) {
      matched.push({
        productId: contains[0]._id.toString(),
        productName: contains[0].name,
        quantity,
        extractedTitle: title,
        matchType: "contains",
      });
      continue;
    }

    // Amazon titles are long; match catalog names by significant tokens (e.g. "Seek Rush")
    const soft = products.filter((p) => titleLooksLikeProduct(p.name, title));
    if (soft.length === 1) {
      matched.push({
        productId: soft[0]._id.toString(),
        productName: soft[0].name,
        quantity,
        extractedTitle: title,
        matchType: "soft",
      });
      continue;
    }

    unmatched.push(title);
  }

  return { matched, unmatched };
}

export function isHighConfidenceMatch(
  matched: ChannelMatchedItem[],
  unmatched: string[],
  confidence: number
): boolean {
  if (!matched.length || unmatched.length) return false;
  const strong = matched.every((item) =>
    ["alias", "exact", "slug", "shortForm", "sku", "amazonSku", "soft"].includes(item.matchType || "")
  );
  return strong || confidence >= 0.85;
}

type DeductionTotals = Map<string, { quantity: number; name: string }>;

/** Inventory lines a set of products needs (from active ProductConfig BOMs). No writes. */
async function computeChannelDeductionTotals(items: ChannelMatchedItem[]): Promise<DeductionTotals> {
  const totals: DeductionTotals = new Map();
  for (const item of items) {
    const config = await ProductConfig.findOne({
      productId: item.productId,
      isActive: true,
    });

    if (!config?.components?.length) {
      throw new InsufficientInventoryError(
        `${item.productName} is not configured for inventory`
      );
    }

    for (const component of config.components) {
      const itemId = component.inventoryItemId.toString();
      const deduction = component.quantity * item.quantity;
      const existing = totals.get(itemId);
      totals.set(itemId, {
        quantity: (existing?.quantity ?? 0) + deduction,
        name: component.inventoryItemName || existing?.name || "Component",
      });
    }
  }
  return totals;
}

/**
 * Pure: what is still left to cut after `alreadyCut` lines (same inventory item ids) were deducted.
 * Used to resume a partly-cut order without ever cutting a line twice.
 */
export function remainingAfterCut(
  totals: Map<string, { quantity: number; name: string }>,
  alreadyCut: Array<{ inventoryItemId: unknown; quantity?: number }>
): Map<string, { quantity: number; name: string }> {
  const cut = new Map<string, number>();
  for (const line of alreadyCut || []) {
    const id = String(line.inventoryItemId || "");
    if (id) cut.set(id, (cut.get(id) || 0) + (Number(line.quantity) || 0));
  }
  const rest = new Map<string, { quantity: number; name: string }>();
  for (const [id, value] of totals) {
    const left = value.quantity - (cut.get(id) || 0);
    if (left > 0) rest.set(id, { quantity: left, name: value.name });
  }
  return rest;
}

/** Pure: merge snapshot lines by inventory item id. */
export function mergeSnapshotLines(...groups: ChannelSnapshotLine[][]): ChannelSnapshotLine[] {
  const byId = new Map<string, ChannelSnapshotLine>();
  for (const group of groups) {
    for (const line of group || []) {
      const id = String(line.inventoryItemId);
      const prev = byId.get(id);
      byId.set(id, {
        inventoryItemId: line.inventoryItemId,
        inventoryItemName: line.inventoryItemName || prev?.inventoryItemName || "",
        quantity: (prev?.quantity || 0) + (Number(line.quantity) || 0),
      });
    }
  }
  return [...byId.values()];
}

/** What the order WOULD cut (no writes) - used when admin marks an interrupted apply as done. */
export async function planChannelDeduction(items: ChannelMatchedItem[]): Promise<ChannelSnapshotLine[]> {
  await connectDB();
  const totals = await computeChannelDeductionTotals(items);
  return [...totals].map(([id, v]) => ({
    inventoryItemId: new mongoose.Types.ObjectId(id),
    inventoryItemName: v.name,
    quantity: v.quantity,
  }));
}

/**
 * Cut stock for matched products. `alreadyCut` = lines a previous partly-failed attempt
 * already deducted; only the remainder is cut. Returns the full (prior + new) snapshot.
 */
export async function deductInventoryForChannelItems(
  items: ChannelMatchedItem[],
  reasonId: string,
  alreadyCut: ChannelSnapshotLine[] = []
): Promise<ChannelSnapshotLine[]> {
  await connectDB();

  const fullTotals = await computeChannelDeductionTotals(items);
  if (fullTotals.size === 0) {
    throw new InsufficientInventoryError("No inventory components to allocate");
  }
  const prior = (alreadyCut || []).filter((l) => l && l.inventoryItemId);
  const totals = remainingAfterCut(fullTotals, prior);
  if (totals.size === 0) return mergeSnapshotLines(prior);

  // Validate every component exists BEFORE any write, so a missing item cannot leave stock half cut.
  const existingCount = await InventoryItem.countDocuments({ _id: { $in: [...totals.keys()] } });
  if (existingCount !== totals.size) {
    const missing = [...totals.values()].map((t) => t.name).join(", ");
    throw new InsufficientInventoryError(`Inventory item missing for one of: ${missing}`);
  }

  const snapshot: ChannelSnapshotLine[] = [];
  const affectedInventoryIds: string[] = [];

  try {
    for (const [itemId, { quantity, name }] of totals) {
      const updated = await InventoryItem.findOneAndUpdate(
        { _id: itemId },
        { $inc: { currentStock: -quantity } },
        { new: true }
      );

      if (!updated) {
        throw new InsufficientInventoryError(`Insufficient inventory for ${name}`);
      }

      affectedInventoryIds.push(itemId);
      snapshot.push({
        inventoryItemId: updated._id,
        inventoryItemName: updated.name,
        quantity,
      });

      await InventoryTransaction.create({
        inventoryItemId: updated._id,
        inventoryItemName: updated.name,
        type: "deduction",
        quantity,
        previousStock: updated.currentStock + quantity,
        newStock: updated.currentStock,
        orderId: reasonId,
        productName: items.map((i) => i.productName).join(", "),
        reason: `Channel email order ${reasonId}`,
        performedBy: "channel-email",
      });
    }
  } catch (error) {
    // Writes already started: tell the caller exactly what was cut so it never re-cuts blindly.
    if (snapshot.length) {
      await syncAffectedProducts([...new Set(affectedInventoryIds)]).catch(() => undefined);
      throw new ChannelPartialDeductionError(
        error instanceof Error ? error.message : "Inventory update interrupted",
        mergeSnapshotLines(prior, snapshot)
      );
    }
    throw error;
  }

  await syncAffectedProducts([...new Set(affectedInventoryIds)]);
  return mergeSnapshotLines(prior, snapshot);
}
/** Thrown when some (not all) inventory lines were already deducted. */
export class ChannelPartialDeductionError extends Error {
  partialSnapshot: ChannelSnapshotLine[];
  constructor(message: string, partialSnapshot: ChannelSnapshotLine[]) {
    super(message);
    this.name = "ChannelPartialDeductionError";
    this.partialSnapshot = partialSnapshot;
  }
}

export async function restoreInventoryFromChannelSnapshot(
  snapshot: ChannelSnapshotLine[],
  reasonId: string
): Promise<void> {
  if (!snapshot?.length) return;
  await connectDB();

  const affectedInventoryIds: string[] = [];

  for (const line of snapshot) {
    const invItem = await InventoryItem.findById(line.inventoryItemId);
    if (!invItem) continue;

    const previousStock = invItem.currentStock;
    invItem.currentStock = previousStock + line.quantity;
    await invItem.save();
    affectedInventoryIds.push(line.inventoryItemId.toString());

    await InventoryTransaction.create({
      inventoryItemId: line.inventoryItemId,
      inventoryItemName: line.inventoryItemName || invItem.name,
      type: "addition",
      quantity: line.quantity,
      previousStock,
      newStock: invItem.currentStock,
      orderId: reasonId,
      productName: "",
      reason: `Channel email cancel/restore ${reasonId}`,
      performedBy: "channel-email",
    });
  }

  if (affectedInventoryIds.length) {
    await syncAffectedProducts([...new Set(affectedInventoryIds)]);
  }
}
