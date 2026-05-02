// packages/database/src/models/ProductCode.ts

import mongoose from "mongoose";

const ProductCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      // ❌ REMOVED: unique: true,
      trim: true,
      uppercase: true,
      // ❌ REMOVED: index: true,
    },
    productId: {
      type: Number,
      required: true,
      enum: [3, 8], // Only Scarf (3) and Seek Rush (8)
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      // ❌ REMOVED: index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      // ❌ REMOVED: index: true,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    usedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

const ProductCode =
  mongoose.models.ProductCode || mongoose.model("ProductCode", ProductCodeSchema);

export default ProductCode;
