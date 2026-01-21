// packages/database/src/models/LotteryCodeBatch.ts

import mongoose from "mongoose";

const LotteryCodeBatchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: true,
      // ❌ REMOVED: unique: true,
      // Format: BATCH-{shortForm}-{YYYYMMDD}-{counter}
      // Example: BATCH-TST-20260106-001
    },
    
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    
    productName: {
      type: String,
      required: true,
    },
    
    shortForm: {
      type: String,
      required: true,
      uppercase: true,
    },
    
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    
    status: {
      type: String,
      enum: ["pending", "downloaded", "sent_for_printing", "printed"],
      default: "pending",
    },
    
    // Generation tracking
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    
    generatedBy: {
      type: String, // Admin email or username
      required: true,
    },
    
    // Status change tracking
    downloadedAt: {
      type: Date,
    },
    
    downloadedBy: {
      type: String,
    },
    
    sentForPrintingAt: {
      type: Date,
    },
    
    sentForPrintingBy: {
      type: String,
    },
    
    printedAt: {
      type: Date,
    },
    
    printedBy: {
      type: String,
    },
    
    // Reference to generated codes
    codeIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotteryCode",
    }],
    
    // Notes (optional)
    notes: {
      type: String,
    },
  },
  { 
    timestamps: true 
  }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

const LotteryCodeBatch = 
  mongoose.models.LotteryCodeBatch || 
  mongoose.model("LotteryCodeBatch", LotteryCodeBatchSchema);

export default LotteryCodeBatch;
