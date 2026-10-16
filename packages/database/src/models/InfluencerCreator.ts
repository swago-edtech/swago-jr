// packages/database/src/models/InfluencerCreator.ts

import mongoose from "mongoose";

const InfluencerCreatorSchema = new mongoose.Schema(
  {
    /** Stable key used in utm_content — unique */
    creatorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["instagram", "youtube", "whatsapp", "facebook", "other"],
      default: "instagram",
    },
    /** Flat campaign / creator fee in INR used for ROAS / CPA */
    feeInr: {
      type: Number,
      default: 0,
      min: 0,
    },
    /** Optional product COGS override contribution for this creator deal */
    productCostInr: {
      type: Number,
      default: 0,
      min: 0,
    },
    defaultCampaign: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.InfluencerCreator ||
  mongoose.model("InfluencerCreator", InfluencerCreatorSchema);
