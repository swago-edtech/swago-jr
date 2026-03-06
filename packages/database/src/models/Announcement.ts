// packages/database/src/models/Announcement.ts

import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Announcement text is required"],
      trim: true,
      minlength: [5, "Announcement must be at least 5 characters"],
      maxlength: [200, "Announcement cannot exceed 200 characters"]
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // Future-proofing: Allow custom background colors later
    backgroundColor: {
      type: String,
      default: "gradient", // "gradient" | "purple" | "pink" | "teal" | "orange"
      enum: {
        values: ["gradient", "purple", "pink", "teal", "orange", "yellow"],
        message: "Background must be one of: gradient, purple, pink, teal, orange, yellow"
      }
    },
    isScrolling: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// ❌ REMOVED: .index() call
// Indexes are now created manually via migration scripts

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);
