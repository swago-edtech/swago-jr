// packages/database/src/models/KidProfile.ts
import mongoose from "mongoose";

const KidProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // index: true, ← REMOVE THIS
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
      type: String, // Color hex or emoji
      default: "🧒",
    },
    // PIN Security Fields
    pin: {
      type: String, // Hashed PIN
      default: null,
    },
    pinHint: {
      type: String,
      default: null,
    },
    pinAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    // Content & Progress
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
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// DELETE THIS LINE - The compound index below handles userId queries
// KidProfileSchema.index({ userId: 1 });

// Keep only this compound index - it handles both:
// 1. Queries by userId (via index prefix)
// 2. Queries by userId + username
KidProfileSchema.index({ userId: 1, username: 1 });

// Method to check if profile is locked
KidProfileSchema.methods.isLocked = function() {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Method to reset PIN attempts
KidProfileSchema.methods.resetAttempts = function() {
  this.pinAttempts = 0;
  this.lockedUntil = null;
  return this.save();
};

// Method to increment failed attempts
KidProfileSchema.methods.incrementAttempts = function() {
  this.pinAttempts += 1;
  if (this.pinAttempts >= 5) {
    // Lock for 30 minutes after 5 attempts
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  return this.save();
};

const KidProfile =
  mongoose.models.KidProfile || mongoose.model("KidProfile", KidProfileSchema);

export default KidProfile;