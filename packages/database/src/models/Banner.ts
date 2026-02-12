// packages/database/src/models/Banner.ts

import mongoose from "mongoose";

const BannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, "Banner image URL is required"],
        },
        link: {
            type: String,
            trim: true,
            default: "",
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        device: {
            type: String,
            enum: ["both", "desktop", "mobile"],
            default: "both",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Banner || mongoose.model("Banner", BannerSchema);
