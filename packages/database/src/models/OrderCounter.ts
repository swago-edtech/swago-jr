// packages/database/src/models/OrderCounter.ts
// Counter for generating sequential daily order IDs (SW-YYMMDD-XXXX format)

import mongoose from "mongoose";

const OrderCounterSchema = new mongoose.Schema({
    // Date in YYMMDD format (e.g., "260126" for 2026-01-26)
    date: {
        type: String,
        required: true,
        unique: true
    },
    // Daily sequence number (resets each day)
    sequence: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Create index for fast lookups
OrderCounterSchema.index({ date: 1 });

export default mongoose.models.OrderCounter ||
    mongoose.model("OrderCounter", OrderCounterSchema);
