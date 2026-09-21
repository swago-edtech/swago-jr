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
 * Try to match an item to a Swago product using its SKU.
 * Looks up InventoryItem by SKU, then finds ProductConfigs that reference that item.
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

  const invItem = await InventoryItem.findOne({
    sku: { $regex: `^${cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  }).select("_id name sku");
  if (!invItem) return null;

  // Find any active ProductConfig whose components reference this inventory item
  const config = await ProductConfig.findOne({
    "components.inventoryItemId": invItem._id,
    isActive: true,
  }).populate("productId", "name");

  if (config) {
    const product = config.productId as any;
    return {
      productId: (product._id || config.productId).toString(),
      productName: product.name || config.productName || "",
    };
  }

  // Fall back to a direct product name match on the inventory item name
  const byName = products.find((p) => normalizeTitle(p.name) === normalizeTitle(invItem.name));
  if (byName) {
    return { productId: byName._id.toString(), productName: byName.name };
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
      const skuMatch = await matchBySku(skuClean, products);
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

      // Product-level Amazon SKU (set on product edit page)
      const byAmazonSku = products.find(
        (p) => String(p.amazonSku || "").trim().toUpperCase() === skuClean
      );
      if (byAmazonSku) {
        matched.push({
          productId: byAmazonSku._id.toString(),
          productName: byAmazonSku.name,
          quantity,
          extractedTitle: title,
          matchType: "amazonSku",
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

export async function deductInventoryForChannelItems(
  items: ChannelMatchedItem[],
  reasonId: string
): Promise<ChannelSnapshotLine[]> {
  await connectDB();

  const totals = new Map<string, { quantity: number; name: string }>();

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

  if (totals.size === 0) {
    throw new InsufficientInventoryError("No inventory components to allocate");
  }

  const snapshot: ChannelSnapshotLine[] = [];
  const affectedInventoryIds: string[] = [];

  for (const [itemId, { quantity, name }] of totals) {
    const updated = await InventoryItem.findOneAndUpdate(
      { _id: itemId },
      { $inc: { currentStock: -quantity } },
      { new: true }
    );

    if (!updated) {
      throw new InsufficientInventoryError(`Insufficient inventory for ${name}`);
      console.warn(`⚠️ Inventory item ${name} (${itemId}) not found, skipping`);
      continue;
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

  await syncAffectedProducts([...new Set(affectedInventoryIds)]);
  return snapshot;
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
