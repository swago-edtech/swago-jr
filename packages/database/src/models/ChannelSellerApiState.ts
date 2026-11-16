import mongoose from "mongoose";

/**
 * Per-platform checkpoint and last-sync status for seller API ingestion.
 * Credentials are never stored here — only env-based.
 */
const ChannelSellerApiStateSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["amazon", "flipkart"],
      required: true,
      unique: true,
    },
    /** When false, polling is skipped without deleting credentials or ingested data. */
    enabled: { type: Boolean, default: true },
    lastSuccessAt: { type: Date, default: null },
    lastAttemptAt: { type: Date, default: null },
    lastError: { type: String, default: "" },
    lastCheckpoint: { type: String, default: "" },
    /** Server-only pagination resume. Not exposed in admin status. */
    resume: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Server-only Flipkart open-shipment watchlist for status reconciliation. */
    outstandingShipments: { type: mongoose.Schema.Types.Mixed, default: [] },
    lastCounts: {
      fetched: { type: Number, default: 0 },
      ingested: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      reviewed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      pages: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.ChannelSellerApiState ||
  mongoose.model("ChannelSellerApiState", ChannelSellerApiStateSchema);
