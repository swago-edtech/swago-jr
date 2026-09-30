import mongoose, { isValidObjectId } from "mongoose";
import connectDB from "../connection";
import Product from "../models/Product";
import InventoryItem from "../models/InventoryItem";
import ProductConfig from "../models/ProductConfig";
import InventoryTransaction from "../models/InventoryTransaction";
import Order from "../models/Order";
import { syncAffectedProducts } from "./inventory-sync";

export class InsufficientInventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientInventoryError";
  }
}

type OrderLike = {
  orderId?: string;
  _id: mongoose.Types.ObjectId | string;
  items: Array<{ productId: any; name?: string; quantity: number }>;
  inventoryAllocationStatus?: string;
  inventorySnapshot?: Array<{
    inventoryItemId: mongoose.Types.ObjectId | string;
    inventoryItemName?: string;
    quantity: number;
  }>;
};

async function resolveProductId(rawId: string): Promise<string | null> {
  if (!rawId) return null;
  if (isValidObjectId(rawId)) return rawId;

  const product = await Product.findOne({ slug: rawId }).select("_id");
  return product ? product._id.toString() : null;
}

async function buildComponentTotals(
  items: OrderLike["items"]
): Promise<Map<string, { quantity: number; name: string }>> {
  const totals = new Map<string, { quantity: number; name: string }>();

  for (const item of items) {
    const rawId = item.productId?.toString();
    if (!rawId) continue;

    const resolvedProductId = await resolveProductId(rawId);
    if (!resolvedProductId) continue;

    const config = await ProductConfig.findOne({
      productId: resolvedProductId,
      isActive: true,
    });

    if (!config?.components?.length) {
      console.warn(`⚠️ ${item.name || rawId} is not configured for inventory, skipping deduction`);
      continue;
    }

    const orderQty = item.quantity || 1;
    for (const component of config.components) {
      const itemId = component.inventoryItemId.toString();
      const deduction = component.quantity * orderQty;
      const existing = totals.get(itemId);
      totals.set(itemId, {
        quantity: (existing?.quantity ?? 0) + deduction,
        name: component.inventoryItemName || existing?.name || "Component",
      });
    }
  }

  return totals;
}

export async function allocateInventoryForOrder(
  order: OrderLike,
  options: { consumeImmediately?: boolean } = {}
) {
  await connectDB();

  if (
    order.inventoryAllocationStatus &&
    ["allocated", "consumed"].includes(order.inventoryAllocationStatus)
  ) {
    return;
  }

  const componentTotals = await buildComponentTotals(order.items);
  if (componentTotals.size === 0) return;

  const snapshot: Array<{
    inventoryItemId: mongoose.Types.ObjectId;
    inventoryItemName: string;
    quantity: number;
  }> = [];
  const affectedInventoryIds: string[] = [];

  const runAllocation = async (session?: mongoose.ClientSession) => {
    for (const [itemId, { quantity, name }] of componentTotals) {
      const updated = await InventoryItem.findOneAndUpdate(
        { _id: itemId },
        { $inc: { currentStock: -quantity } },
        { new: true, session }
      );

      if (!updated) {
        console.warn(`⚠️ Inventory item ${name} (${itemId}) not found, skipping allocation`);
        continue;
      }

      affectedInventoryIds.push(itemId);
      snapshot.push({
        inventoryItemId: updated._id,
        inventoryItemName: updated.name,
        quantity,
      });

      await InventoryTransaction.create(
        [
          {
            inventoryItemId: updated._id,
            inventoryItemName: updated.name,
            type: "deduction",
            quantity,
            previousStock: updated.currentStock + quantity,
            newStock: updated.currentStock,
            orderId: order.orderId || "",
            orderMongoId: order._id,
            productName: "",
            reason: `Order allocation ${order.orderId || order._id}`,
            performedBy: "system",
          },
        ],
        session ? { session } : undefined
      );
    }

    await Order.updateOne(
      { _id: order._id, inventoryAllocationStatus: { $in: ["none", null] } },
      {
        $set: {
          inventoryAllocationStatus: options.consumeImmediately
            ? "consumed"
            : "allocated",
          inventorySnapshot: snapshot,
        },
      },
      session ? { session } : undefined
    );
  };

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await runAllocation(session);
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.hasErrorLabel?.("TransientTransactionError")
    ) {
      await runAllocation();
    } else if (
      error instanceof Error &&
      error.message.includes("Transaction numbers are only allowed")
    ) {
      await runAllocation();
    } else {
      throw error;
    }
  } finally {
    session.endSession();
  }

  const uniqueInvIds = [...new Set(affectedInventoryIds)];
  if (uniqueInvIds.length > 0) {
    await syncAffectedProducts(uniqueInvIds);
  }
}

export async function releaseInventoryAllocation(order: OrderLike) {
  await connectDB();

  if (
    !order.inventorySnapshot?.length ||
    !order.inventoryAllocationStatus ||
    !["allocated", "consumed"].includes(order.inventoryAllocationStatus)
  ) {
    return;
  }

  if (order.inventoryAllocationStatus === "released") return;

  const affectedInventoryIds: string[] = [];

  for (const line of order.inventorySnapshot) {
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
      orderId: order.orderId || "",
      orderMongoId: order._id,
      productName: "",
      reason: `Order release ${order.orderId || order._id}`,
      performedBy: "system",
    });
  }

  await Order.updateOne(
    { _id: order._id },
    { $set: { inventoryAllocationStatus: "released" } }
  );

  const uniqueInvIds = [...new Set(affectedInventoryIds)];
  if (uniqueInvIds.length > 0) {
    await syncAffectedProducts(uniqueInvIds);
  }
}

export async function markInventoryAllocationConsumed(orderId: mongoose.Types.ObjectId | string) {
  await Order.updateOne(
    { _id: orderId, inventoryAllocationStatus: "allocated" },
    { $set: { inventoryAllocationStatus: "consumed" } }
  );
}

/** @deprecated Use allocateInventoryForOrder for new orders */
export async function deductInventoryForOrder(order: OrderLike) {
  if (
    order.inventoryAllocationStatus &&
    ["allocated", "consumed"].includes(order.inventoryAllocationStatus)
  ) {
    return;
  }

  try {
    await connectDB();
    const affectedInventoryIds: string[] = [];

    for (const item of order.items) {
      const rawId = item.productId?.toString();
      if (!rawId) continue;

      const resolvedProductId = await resolveProductId(rawId);
      if (!resolvedProductId) continue;

      const config = await ProductConfig.findOne({
        productId: resolvedProductId,
        isActive: true,
      });

      if (!config?.components?.length) continue;

      const orderQty = item.quantity || 1;

      for (const component of config.components) {
        const deduction = component.quantity * orderQty;

        const updated = await InventoryItem.findOneAndUpdate(
          { _id: component.inventoryItemId },
          { $inc: { currentStock: -deduction } },
          { new: true }
        );

        if (!updated) {
          console.warn(`⚠️ Inventory item ${component.inventoryItemId} not found, skipping deduction`);
          continue;
        }

        affectedInventoryIds.push(component.inventoryItemId.toString());
        await InventoryTransaction.create({
          inventoryItemId: component.inventoryItemId,
          inventoryItemName: updated.name,
          type: "deduction",
          quantity: deduction,
          previousStock: updated.currentStock + deduction,
          newStock: updated.currentStock,
          orderId: order.orderId || "",
          orderMongoId: order._id,
          productName: item.name || "",
          reason: `Order ${order.orderId || order._id}`,
          performedBy: "system",
        });
      }
    }

    const uniqueInvIds = [...new Set(affectedInventoryIds)];
    if (uniqueInvIds.length > 0) {
      await syncAffectedProducts(uniqueInvIds);
    }
  } catch (error) {
    console.error("⚠️ Inventory deduction service error:", error);
    throw error;
  }
}

export async function restoreInventoryForOrder(
  order: OrderLike,
  performedBy = "system"
) {
  if (order.inventoryAllocationStatus === "restored") return;

  await connectDB();

  if (order.inventorySnapshot?.length) {
    await releaseInventoryAllocation(order);
    await Order.updateOne(
      { _id: order._id },
      { $set: { inventoryAllocationStatus: "restored" } }
    );
    return;
  }

  const affectedInventoryIds: string[] = [];

  for (const item of order.items) {
    const rawId = item.productId?.toString();
    if (!rawId) continue;

    const resolvedProductId = await resolveProductId(rawId);
    if (!resolvedProductId) continue;

    const config = await ProductConfig.findOne({
      productId: resolvedProductId,
      isActive: true,
    });

    if (!config?.components?.length) continue;

    const orderQty = item.quantity || 1;

    for (const component of config.components) {
      const addition = component.quantity * orderQty;

      const invItem = await InventoryItem.findById(component.inventoryItemId);
      if (!invItem) continue;

      const previousStock = invItem.currentStock;
      invItem.currentStock = previousStock + addition;
      await invItem.save();

      affectedInventoryIds.push(component.inventoryItemId.toString());

      await InventoryTransaction.create({
        inventoryItemId: component.inventoryItemId,
        inventoryItemName: invItem.name,
        type: "addition",
        quantity: addition,
        previousStock,
        newStock: invItem.currentStock,
        orderId: order.orderId || "",
        orderMongoId: order._id,
        productName: item.name || "",
        reason: `Order Cancellation/Return ${order.orderId || order._id}`,
        performedBy,
      });
    }
  }

  const uniqueInvIds = [...new Set(affectedInventoryIds)];
  if (uniqueInvIds.length > 0) {
    await syncAffectedProducts(uniqueInvIds);
  }

  await Order.updateOne(
    { _id: order._id },
    { $set: { inventoryAllocationStatus: "restored" } }
  );
}

export function orderHadInventoryDeducted(order: {
  status?: string;
  paymentMethod?: string;
  inventoryAllocationStatus?: string;
}): boolean {
  const deductedStatuses = ["allocated", "consumed"];
  if (
    order.inventoryAllocationStatus &&
    deductedStatuses.includes(order.inventoryAllocationStatus)
  ) {
    return true;
  }

  const fulfilledStatuses = [
    "Paid",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  if (order.status && fulfilledStatuses.includes(order.status)) {
    return true;
  }

  if (
    order.status === "Pending" &&
    order.paymentMethod === "cod" &&
    order.inventoryAllocationStatus === "consumed"
  ) {
    return true;
  }

  return false;
}
