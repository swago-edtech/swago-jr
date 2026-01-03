import mongoose from "mongoose";

const LotteryCodeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },
    code: {
      type: String,
      required: [true, "Code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    // 🆕 NEW: Track which short form was used for this code
    shortForm: {
      type: String,
      required: [true, "Short form is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
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

// Compound index for fast queries: find unused codes for a product
LotteryCodeSchema.index({ productId: 1, isUsed: 1 });

// Index for user's lottery codes
LotteryCodeSchema.index({ usedBy: 1, usedAt: -1 });

// 🆕 NEW: Compound index for product + short form queries
LotteryCodeSchema.index({ productId: 1, shortForm: 1 });

const LotteryCode =
  mongoose.models.LotteryCode ||
  mongoose.model("LotteryCode", LotteryCodeSchema);

export default LotteryCode;
