import mongoose from "mongoose";

/**
 * Sales record for marketplace (Amazon) orders synced from channel email.
 * Separate from website Order — no user/address/COD requirements.
 */
const ChannelOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["amazon"],
      default: "amazon",
      index: true,
    },
    externalOrderId: {
      type: String,
      default: "",
      index: true,
    },
    channelEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChannelOrderEvent",
      index: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Cancelled"],
      default: "Confirmed",
      index: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.Mixed },
        name: { type: String, default: "" },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 1 },
        image: { type: String, default: "" },
        extractedTitle: { type: String, default: "" },
        matchType: { type: String, default: "" },
      },
    ],
    itemCount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    inventorySnapshot: [
      {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        inventoryItemName: { type: String, default: "" },
        quantity: { type: Number, default: 0 },
      },
    ],
    subject: { type: String, default: "" },
    fromEmail: { type: String, default: "" },
    receivedAt: { type: Date },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

ChannelOrderSchema.index({ channel: 1, createdAt: -1 });
ChannelOrderSchema.index({ status: 1, createdAt: -1 });
ChannelOrderSchema.index({ receivedAt: -1 });
ChannelOrderSchema.index(
  { channel: 1, externalOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { externalOrderId: { $type: "string", $gt: "" } },
  }
);

export default mongoose.models.ChannelOrder ||
  mongoose.model("ChannelOrder", ChannelOrderSchema);
