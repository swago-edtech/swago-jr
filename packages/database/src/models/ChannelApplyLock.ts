import mongoose from "mongoose";

/**
 * One document per (marketplace order id + product) that has had stock cut.
 * `_id` is the key itself, so inserting is an atomic claim: a second concurrent
 * insert for the same key fails with E11000 and that run skips the deduction.
 * New collection - no migration of existing data needed.
 */
const ChannelApplyLockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    externalOrderId: { type: String, default: "" },
    productId: { type: String, default: "" },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "ChannelOrderEvent" },
    quantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.ChannelApplyLock ||
  mongoose.model("ChannelApplyLock", ChannelApplyLockSchema);