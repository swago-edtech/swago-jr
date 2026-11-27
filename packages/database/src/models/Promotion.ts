// packages/database/src/models/Promotion.ts

import mongoose from "mongoose";

const PromotionSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            default: "Standard Promotion"
        },
        isActive: {
            type: Boolean,
            default: true
        },
        redemptionTiers: [
            {
                target: { type: Number, required: true },
                off: { type: Number, required: true }
            }
        ],
        bonusItems: [
            {
                threshold: { type: Number, required: true },
                label: { type: String, required: true },
                slug: { type: String, required: true },
                rewardType: { type: String, default: 'gift' }
            }
        ],
        shippingThreshold: {
            type: Number,
            default: 1450
        },
        // ISO 3166-2 codes (e.g. "IN-MN"). Legacy entries may still be state names;
        // the storefront matches both until scripts/convert-promotion-states.ts is applied.
        blockedCodStates: [{
            type: String
        }],
        // 6-digit Indian PIN codes (validated by the admin promotion API)
        blockedCodPincodes: [{
            type: String
        }]
    },
    { timestamps: true }
);

// Ensure model is updated during Next.js hot-reloads
if (mongoose.models.Promotion) {
    delete mongoose.models.Promotion;
}

export default mongoose.model("Promotion", PromotionSchema);
