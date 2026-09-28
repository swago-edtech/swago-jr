// packages/database/src/models/HowToPlay.ts

import mongoose from "mongoose";

const HowToPlaySchema = new mongoose.Schema(
  {
    // Public URL segment: /how-to-play/<slug> (unique index: scripts/indexes/14-howtoplay-indexes.js)
    slug: {
      type: String,
      required: [true, "Route slug is required"],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and hyphens"],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    youtubeUrl: {
      type: String,
      required: [true, "YouTube link is required"],
      trim: true,
    },

    youtubeVideoId: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional: powers the "Buy this game" button on the page
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.HowToPlay || mongoose.model("HowToPlay", HowToPlaySchema);
