import mongoose from "mongoose";

const ProductCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // Each code is unique
      trim: true,
      uppercase: true,
      index: true, // Fast lookup by code
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
      index: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true, // Fast lookup for unused codes
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KidProfile", // References kid profile, not User!
    },
    usedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for finding codes by order
ProductCodeSchema.index({ orderId: 1, productId: 1 });

// Index for finding used codes by kid
ProductCodeSchema.index({ usedBy: 1 });

const ProductCode =
  mongoose.models.ProductCode || mongoose.model("ProductCode", ProductCodeSchema);

export default ProductCode;