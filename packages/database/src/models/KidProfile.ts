import mongoose from "mongoose";

const KidProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 3,
      max: 18,
    },
    grade: {
      type: String,
      enum: [
        "Pre-K",
        "Kindergarten",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
      ],
    },
    avatar: {
      type: String, // Emoji or image URL
      default: "🧒",
    },
    unlockedProducts: [
      {
        productId: {
          type: Number,
          required: true,
        },
        code: {
          type: String,
          required: true,
        },
        unlockedAt: {
          type: Date,
          default: Date.now,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      },
    ],
    progress: {
      type: mongoose.Schema.Types.Mixed, // Flexible object for future games
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index to ensure userId has max 2 kids
KidProfileSchema.index({ userId: 1 });

// Index for faster lookups by username within a parent
KidProfileSchema.index({ userId: 1, username: 1 });

const KidProfile =
  mongoose.models.KidProfile || mongoose.model("KidProfile", KidProfileSchema);

export default KidProfile;