import mongoose from "mongoose";
import ProductConfig from "../models/ProductConfig";
import InventoryItem from "../models/InventoryItem";
import Product from "../models/Product";

/**
 * Recalculates and updates the stock of all products that utilize any of the provided inventory items.
 * @param inventoryItemIds Array of raw inventory item IDs that were modified.
 */
export async function syncAffectedProducts(inventoryItemIds: string[]) {
  if (!inventoryItemIds || inventoryItemIds.length === 0) return;

  try {
    // 1. Find all product configs that contain ANY of these inventory items
    const affectedConfigs = await ProductConfig.find({
      isActive: true,
      "components.inventoryItemId": { $in: inventoryItemIds },
    });

    if (!affectedConfigs || affectedConfigs.length === 0) return;

    // 2. Extract unique product IDs
    const productIds = affectedConfigs.map((config) => config.productId);

    // 3. For each affected product, recalculate max stock
    for (const productId of productIds) {
      const config = await ProductConfig.findOne({ productId }).populate({
        path: "components.inventoryItemId",
        model: InventoryItem,
      });

      if (!config || !config.components || config.components.length === 0) {
        continue;
      }

      let maxPossible = Infinity;

      for (const comp of config.components) {
        const item = comp.inventoryItemId as any;
        if (!item) continue;
        
        const requiredQty = comp.quantity;
        if (requiredQty <= 0) continue;

        const available = item.currentStock || 0;
        const possibleWithThis = Math.floor(available / requiredQty);

        if (possibleWithThis < maxPossible) {
          maxPossible = possibleWithThis;
        }
      }

      if (maxPossible === Infinity) maxPossible = 0;

      // 4. Update the Product model
      await Product.findByIdAndUpdate(productId, { stock: maxPossible });
    }
  } catch (error) {
    console.error("⚠️ Failed to sync affected products:", error);
  }
}
