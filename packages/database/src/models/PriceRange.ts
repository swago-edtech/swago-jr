// packages/database/src/models/PriceRange.ts
import mongoose from "mongoose";

const PriceRangeSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        value: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["under", "above"],
            default: "under",
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.models.PriceRange || mongoose.model("PriceRange", PriceRangeSchema);
