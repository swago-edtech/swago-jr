import mongoose from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import ChannelOrder from "../models/ChannelOrder";

type MatchedItem = {
  productId?: string;
  productName?: string;
  quantity?: number;
  extractedTitle?: string;
  matchType?: string;
};

type InventoryLine = {
  inventoryItemId?: mongoose.Types.ObjectId | string;
  inventoryItemName?: string;
  quantity?: number;
};

function buildChannelOrderId(externalOrderId?: string, eventId?: string) {
  if (externalOrderId) {
    const cleaned = String(externalOrderId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    // Keep enough of the Amazon id to avoid collisions; prefix AMZ-
    return `AMZ-${cleaned.slice(-28) || "ORDER"}`;
  }
  const suffix = String(eventId || Date.now()).replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase();
  return `AMZ-${suffix || Date.now().toString(36).toUpperCase()}`;
}

async function resolveLineItems(matchedItems: MatchedItem[]) {
  const lines = [];
  for (const item of matchedItems || []) {
    const productId = item.productId?.toString();
    let price = 0;
    let image = "";
    let name = item.productName || item.extractedTitle || "Product";

    if (productId && mongoose.isValidObjectId(productId)) {
      const product = (await Product.findById(productId)
        .select("name price images")
        .lean()) as { name?: string; price?: number; images?: string[] } | null;
      if (product) {
        name = product.name || name;
        price = Number(product.price) || 0;
        image = product.images?.[0] || "";
      }
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);
    lines.push({
      productId: productId || "",
      name,
      price,
      quantity,
      image,
      extractedTitle: item.extractedTitle || "",
      matchType: item.matchType || "",
    });
  }
  return lines;
}

function saleDateFromEvent(event: { receivedAt?: Date; createdAt?: Date }) {
  if (event.receivedAt) return new Date(event.receivedAt);
  if (event.createdAt) return new Date(event.createdAt);
  return new Date();
}

export async function upsertChannelOrderFromEvent(event: {
  _id: mongoose.Types.ObjectId | string;
  externalOrderId?: string;
  matchedItems?: MatchedItem[];
  inventorySnapshot?: InventoryLine[];
  subject?: string;
  fromEmail?: string;
  receivedAt?: Date;
  createdAt?: Date;
  channel?: string;
}) {
  await connectDB();

  const eventId = event._id?.toString();
  const externalOrderId = String(event.externalOrderId || "").trim();
  const items = await resolveLineItems(event.matchedItems || []);
  const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
  const inventorySnapshot = (event.inventorySnapshot || []).map((line) => ({
    inventoryItemId: line.inventoryItemId,
    inventoryItemName: line.inventoryItemName || "",
    quantity: line.quantity || 0,
  }));

  const query = externalOrderId
    ? { channel: "amazon", externalOrderId }
    : { channelEventId: event._id };

  const existing = await ChannelOrder.findOne(query);
  const orderId = existing?.orderId || buildChannelOrderId(externalOrderId, eventId);
  const saleDate = saleDateFromEvent(event);

  const payload: Record<string, unknown> = {
    orderId,
    channel: "amazon",
    externalOrderId,
    channelEventId: event._id,
    status: "Confirmed",
    items,
    itemCount,
    subtotal,
    total: subtotal,
    inventorySnapshot,
    subject: event.subject || "",
    fromEmail: event.fromEmail || "",
    receivedAt: saleDate,
    confirmedAt: existing?.confirmedAt || saleDate,
  };

  if (existing) {
    await ChannelOrder.updateOne(
      { _id: existing._id },
      {
        $set: payload,
        $unset: { cancelledAt: 1 },
      }
    );
    return ChannelOrder.findById(existing._id);
  }

  return ChannelOrder.create({
    ...payload,
    // Anchor list/analytics sort to marketplace email time, not insert time
    createdAt: saleDate,
    updatedAt: new Date(),
  });
}

export async function cancelChannelOrderFromExternalId(externalOrderId: string) {
  if (!externalOrderId) return null;
  await connectDB();
  const order = await ChannelOrder.findOne({
    channel: "amazon",
    externalOrderId: String(externalOrderId).trim(),
  });
  if (!order) return null;
  order.status = "Cancelled";
  order.cancelledAt = new Date();
  await order.save();
  return order;
}

/**
 * Create/heal ChannelOrders from applied/restored email events.
 * Safe to call from Orders UI and analytics — idempotent.
 */
export async function backfillChannelOrdersFromAppliedEvents(limit = 2000) {
  await connectDB();
  const ChannelOrderEvent = (await import("../models/ChannelOrderEvent")).default;
  const events = await ChannelOrderEvent.find({
    eventType: "order",
    status: { $in: ["applied", "restored"] },
  })
    .sort({ receivedAt: -1, createdAt: -1 })
    .limit(limit);

  let created = 0;
  let healed = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const existing = event.externalOrderId
        ? await ChannelOrder.findOne({ channel: "amazon", externalOrderId: event.externalOrderId })
        : await ChannelOrder.findOne({ channelEventId: event._id });

      if (existing) {
        let changed = false;
        if (event.status === "restored" && existing.status !== "Cancelled") {
          existing.status = "Cancelled";
          existing.cancelledAt = existing.cancelledAt || new Date();
          changed = true;
        }
        // Heal missing sale date from email receivedAt
        if (event.receivedAt && !existing.receivedAt) {
          existing.receivedAt = event.receivedAt;
          changed = true;
        }
        if (changed) {
          await existing.save();
          healed += 1;
        }
        continue;
      }

      await upsertChannelOrderFromEvent(event);
      if (event.status === "restored") {
        await cancelChannelOrderFromExternalId(event.externalOrderId);
      }
      created += 1;
    } catch (err) {
      errors += 1;
      console.error("Channel order backfill failed for event", event._id?.toString(), err);
    }
  }

  return { created, healed, errors, scanned: events.length };
}

let backfillInFlight: Promise<{ created: number; healed: number; errors: number; scanned: number }> | null =
  null;
let lastBackfillAt = 0;

/** Debounced backfill for analytics/order reads (at most once per 60s process-wide). */
export async function ensureChannelOrdersBackfilled(limit = 2000) {
  const now = Date.now();
  if (now - lastBackfillAt < 60_000 && !backfillInFlight) {
    return { created: 0, healed: 0, errors: 0, scanned: 0, skipped: true as const };
  }
  if (backfillInFlight) return backfillInFlight;

  backfillInFlight = backfillChannelOrdersFromAppliedEvents(limit)
    .then((result) => {
      lastBackfillAt = Date.now();
      return result;
    })
    .finally(() => {
      backfillInFlight = null;
    });

  return backfillInFlight;
}
