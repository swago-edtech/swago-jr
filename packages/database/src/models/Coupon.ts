// packages/database/src/models/Coupon.ts

import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["percentage", "fixed"],
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        description: {
            type: String,
            required: true,
        },
        minAmount: {
            type: Number,
            default: 0,
        },
        maxDiscount: {
            type: Number,
            default: null,
        },
        active: {
            type: Boolean,
            default: true,
        },
        expiryDate: {
            type: Date,
            default: null,
        },
        usageLimit: {
            type: Number,
            default: null,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        applicableProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }],
        isPublic: {
            type: Boolean,
            default: true,
        },
        targetGroup: {
            type: String,
            enum: ["all", "new_users", "no_orders", "specific_users"],
            default: "all",
        },
        targetUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    { timestamps: true }
);

const Coupon = mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
export default Coupon;
