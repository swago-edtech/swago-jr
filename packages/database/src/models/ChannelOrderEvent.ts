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
      enum: ["pending_review", "processing", "applied", "restored", "ignored", "failed", "skipped"],
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
          price: { type: String, default: "" },
        },
      ],
      // Optional parse details shown in admin (all backward compatible)
      parseMethod: { type: String, default: "" }, // regex | subject | ai | none
      expectedItemCount: { type: Number, default: null },
      parsedItemCount: { type: Number, default: null },
      parsedQuantity: { type: Number, default: null },
      shipBy: { type: String, default: "" },
      orderDate: { type: String, default: "" },
    },
    /** "<orderId>|<productId>" keys this event cut stock for (see ChannelApplyLock). */
    appliedKeys: [{ type: String }],
    /** Products skipped because an earlier event already cut stock for them. */
    skippedDuplicates: [{ type: String }],
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
    /** Why a failed event failed: "partial" (some lines cut, see inventorySnapshot) | "interrupted" (lock held, unknown) */
    failureKind: { type: String, default: "" },
    /** Short claim while "Cut missing items" runs on an applied event (prevents double clicks) */
    recheckLockAt: { type: Date, default: null },
    /** Admin decisions on this event (who/when/what) */
    auditLog: [
      {
        action: { type: String, default: "" },
        by: { type: String, default: "" },
        at: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

ChannelOrderEventSchema.index({ status: 1, receivedAt: -1, createdAt: -1 });
ChannelOrderEventSchema.index({ eventType: 1, externalOrderId: 1 });

export default mongoose.models.ChannelOrderEvent ||
  mongoose.model("ChannelOrderEvent", ChannelOrderEventSchema);
