// packages/database/src/models/LotteryCode.ts

import mongoose from "mongoose";

const LotteryCodeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      // ❌ REMOVED: index: true,
    },
    code: {
      type: String,
      required: [true, "Code is required"],
      // ❌ REMOVED: unique: true,
      uppercase: true,
      trim: true,
      // ❌ REMOVED: index: true,
    },
    // 🆕 NEW: Track which short form was used for this code
    shortForm: {
      type: String,
      required: [true, "Short form is required"],
      uppercase: true,
      trim: true,
      // ❌ REMOVED: index: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryCodeBatch",
      required: [true, "Batch ID is required"],
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

const LotteryCode =
  mongoose.models.LotteryCode ||
  mongoose.model("LotteryCode", LotteryCodeSchema);

export default LotteryCode;
