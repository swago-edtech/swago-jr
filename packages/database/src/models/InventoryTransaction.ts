import mongoose from "mongoose";

const InventoryTransactionSchema = new mongoose.Schema(
  {
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    inventoryItemName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      // "discard" = faulty/damaged units written off (not a sale)
      enum: ["addition", "deduction", "adjustment", "discard"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      default: "",
    },
    orderMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    productName: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      default: "",
    },
    performedBy: {
      type: String,
      default: "system",
    },
  },
  { timestamps: true }
);

InventoryTransactionSchema.index({ inventoryItemId: 1, createdAt: -1 });
InventoryTransactionSchema.index({ orderId: 1 });
InventoryTransactionSchema.index({ type: 1 });

export default mongoose.models.InventoryTransaction ||
  mongoose.model("InventoryTransaction", InventoryTransactionSchema);
