import mongoose from "mongoose";

const InventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      unique: true,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      sparse: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    targetQuantity: {
      type: Number,
      default: 100,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /**
     * Idempotency tokens of channel-order stock moves, written in the SAME atomic update as the
     * `$inc` on currentStock (see channel-ledger moveComponents). Lets a crashed move be retried
     * without cutting twice. Capped; hidden from normal reads.
     */
    channelOps: {
      type: [{ _id: false, t: String, q: Number, at: Date }],
      default: undefined,
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.InventoryItem ||
  mongoose.model("InventoryItem", InventoryItemSchema);
