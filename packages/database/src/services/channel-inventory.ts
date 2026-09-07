import mongoose from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import ProductConfig from "../models/ProductConfig";
import InventoryItem from "../models/InventoryItem";
import InventoryTransaction from "../models/InventoryTransaction";
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
};

function normalizeTitle(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function matchChannelProducts(
  extractedItems: Array<{ title?: string; quantity?: number; sku?: string }>,
  aliases: Array<{ alias: string; productId: { toString(): string }; productName?: string }>
): Promise<{ matched: ChannelMatchedItem[]; unmatched: string[] }> {
  await connectDB();

  const products = (await Product.find({ isActive: true })
    .select("_id name slug shortForms")
    .lean()) as unknown as ProductLean[];

  const matched: ChannelMatchedItem[] = [];
  const unmatched: string[] = [];

  for (const item of extractedItems) {
    const title = item.title || "";
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const normalized = normalizeTitle(title);
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
    ["alias", "exact", "slug", "shortForm"].includes(item.matchType || "")
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
      { _id: itemId, currentStock: { $gte: quantity } },
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
