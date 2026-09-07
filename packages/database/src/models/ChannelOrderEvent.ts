import mongoose from "mongoose";

const ChannelOrderEventSchema = new mongoose.Schema(
  {
    gmailMessageId: { type: String, required: true, unique: true },
    channel: { type: String, default: "amazon" },
    eventType: {
      type: String,
      enum: ["order", "cancel", "unknown"],
      default: "unknown",
    },
    status: {
      type: String,
      enum: ["pending_review", "applied", "restored", "ignored", "failed", "skipped"],
      default: "pending_review",
    },
    externalOrderId: { type: String, default: "", index: true },
    fromEmail: { type: String, default: "" },
    subject: { type: String, default: "" },
    receivedAt: { type: Date },
    rawText: { type: String, default: "" },
    extracted: {
      confidence: { type: Number, default: 0 },
      reasoning: { type: String, default: "" },
      items: [
        {
          title: { type: String, default: "" },
          quantity: { type: Number, default: 1 },
          sku: { type: String, default: "" },
        },
      ],
    },
    matchedItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        extractedTitle: { type: String, default: "" },
        matchType: { type: String, default: "" },
      },
    ],
    inventorySnapshot: [
      {
        inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        inventoryItemName: { type: String, default: "" },
        quantity: { type: Number, default: 0 },
      },
    ],
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

ChannelOrderEventSchema.index({ status: 1, createdAt: -1 });
ChannelOrderEventSchema.index({ eventType: 1, externalOrderId: 1 });

export default mongoose.models.ChannelOrderEvent ||
  mongoose.model("ChannelOrderEvent", ChannelOrderEventSchema);
