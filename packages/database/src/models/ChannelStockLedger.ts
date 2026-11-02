import mongoose from "mongoose";

/**
 * How many units of a product have been cut for a marketplace order.
 * `_id` = "<orderKey>|<productId>" - unique by construction (one row per order + product).
 * Stock to move = desired qty (ChannelOrder) - ledger qty. `pending` makes every move
 * crash-safe: it is written BEFORE stock changes and cleared after, and inventory
 * transactions carry the same opId so an interrupted move can be verified.
 */
const ComponentSchema = new mongoose.Schema(
  {
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    inventoryItemName: { type: String, default: "" },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const ChannelStockLedgerSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    orderKey: { type: String, required: true, index: true },
    productId: { type: String, required: true },
    productName: { type: String, default: "" },
    /** units of the product currently cut for this order */
    quantity: { type: Number, default: 0 },
    /** inventory components currently cut for this line (used to restore exactly) */
    components: { type: [ComponentSchema], default: [] },
    pending: {
      type: new mongoose.Schema(
        {
          opId: String,
          target: Number,
          kind: String,
          components: { type: [ComponentSchema], default: [] },
          at: Date,
        },
        { _id: false }
      ),
      default: null,
    },
    history: [
      {
        _id: false,
        opId: String,
        from: Number,
        to: Number,
        by: String,
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.ChannelStockLedger ||
  mongoose.model("ChannelStockLedger", ChannelStockLedgerSchema);
