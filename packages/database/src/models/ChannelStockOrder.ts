import mongoose from "mongoose";

/**
 * One canonical record per marketplace order (`_id` = normalised order id, e.g. "405-9711223-6892306").
 * Every email of the order is merged here; stock is cut from this record, never per email.
 */
const LineSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ChannelStockOrderSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    channel: { type: String, default: "amazon" },
    externalOrderId: { type: String, default: "" },
    /** One entry per email (event). Desired qty per product = MAX across trusted sources. */
    sources: [
      {
        _id: false,
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "ChannelOrderEvent" },
        gmailMessageId: { type: String, default: "" },
        lines: { type: [LineSchema], default: [] },
        trusted: { type: Boolean, default: false },
        by: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
    /** Admin-confirmed quantities (Cut missing / manual pick); also MAX-merged. */
    manualLines: { type: [LineSchema], default: [] },
    cancelled: { type: Boolean, default: false },
    /** Order-level mutex: only one stock sync / repair per order at a time. */
    syncLockAt: { type: Date, default: null },
    syncOpId: { type: String, default: "" },
    /** Cut before the ledger existed: never auto-cut until the one-time repair seeded the ledger. */
    needsRepair: { type: Boolean, default: false },
    needsReview: { type: Boolean, default: false },
    note: { type: String, default: "" },
    repairedAt: { type: Date, default: null },
    /** Bumped after each committed repair; repair op ids are derived from it, so a crashed repair re-run reuses them. */
    repairGen: { type: Number, default: 0 },
    lastSyncAt: { type: Date, default: null },
    history: [
      {
        _id: false,
        action: String,
        by: String,
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

ChannelStockOrderSchema.index({ needsRepair: 1 });
ChannelStockOrderSchema.index({ needsReview: 1 });

export default mongoose.models.ChannelStockOrder ||
  mongoose.model("ChannelStockOrder", ChannelStockOrderSchema);
