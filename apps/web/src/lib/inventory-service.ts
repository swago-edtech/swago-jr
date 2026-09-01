import { isValidObjectId } from "mongoose";
import {
  connectDB,
  Product,
  InventoryItem,
  ProductConfig,
  InventoryTransaction,
  syncAffectedProducts,
} from "@swago/database";

export async function deductInventoryForOrder(order: {
  orderId?: string;
  _id: any;
  items: Array<{ productId: any; name?: string; quantity: number }>;
}) {
  try {
    await connectDB();
    const affectedInventoryIds: string[] = [];

    for (const item of order.items) {
      const rawId = item.productId?.toString();
      if (!rawId) continue;

      let resolvedProductId = rawId;

      if (!isValidObjectId(rawId)) {
        const product = await Product.findOne({ slug: rawId });
        if (!product) continue;
        resolvedProductId = product._id.toString();
      }

      const config = await ProductConfig.findOne({
        productId: resolvedProductId,
        isActive: true,
      });

      if (!config?.components?.length) continue;

      const orderQty = item.quantity || 1;

      for (const component of config.components) {
        const deduction = component.quantity * orderQty;

        const invItem = await InventoryItem.findById(
          component.inventoryItemId
        );
        if (!invItem) continue;

        const previousStock = invItem.currentStock;
        invItem.currentStock = Math.max(0, previousStock - deduction);
        await invItem.save();

        affectedInventoryIds.push(component.inventoryItemId.toString());
        await InventoryTransaction.create({
          inventoryItemId: component.inventoryItemId,
          inventoryItemName: invItem.name,
          type: "deduction",
          quantity: deduction,
          previousStock,
          newStock: invItem.currentStock,
          orderId: order.orderId || "",
          orderMongoId: order._id,
          productName: item.name || "",
          reason: `Order ${order.orderId || order._id}`,
          performedBy: "system",
        });
      }
    }
    // Sync product stocks
    const uniqueInvIds = [...new Set(affectedInventoryIds)];
    if (uniqueInvIds.length > 0) {
      await syncAffectedProducts(uniqueInvIds);
    }
  } catch (error) {
    console.error("⚠️ Inventory deduction service error:", error);
  }
}

export async function restoreInventoryForOrder(order: {
  orderId?: string;
  _id: any;
  items: Array<{ productId: any; name?: string; quantity: number }>;
}) {
  try {
    await connectDB();
    const affectedInventoryIds: string[] = [];

    for (const item of order.items) {
      const rawId = item.productId?.toString();
      if (!rawId) continue;

      let resolvedProductId = rawId;

      if (!isValidObjectId(rawId)) {
        const product = await Product.findOne({ slug: rawId });
        if (!product) continue;
        resolvedProductId = product._id.toString();
      }

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
          performedBy: "system",
        });
      }
    }
    // Sync product stocks
    const uniqueInvIds = [...new Set(affectedInventoryIds)];
    if (uniqueInvIds.length > 0) {
      await syncAffectedProducts(uniqueInvIds);
    }
  } catch (error) {
    console.error("⚠️ Inventory restore service error:", error);
  }
}
