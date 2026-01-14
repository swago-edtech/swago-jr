// packages/database/src/models/KidProfile.ts
import mongoose from "mongoose";

const KidProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
      type: String, // Color hex or image path
      default: "🧒",
    },
    // ✅ Gender for avatar selection
    gender: {
      type: String,
      enum: ["boy", "girl", "other"],
      default: "other",
    },
    // PIN Security Fields
    pin: {
      type: String,
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
    // ✅ Ambassador Program Fields
    ambassador: {
      isAmbassador: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["not_started", "profile_created", "entry_pending", "entry_approved", "entry_rejected", "brand_ambassador"],
        default: "not_started",
      },
      swagoMoney: {
        type: Number,
        default: 0,
      },
      badges: [{
        name: String,
        awardedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      currentStep: {
        type: Number,
        default: 1, // Step 1: Profile Created
        min: 1,
        max: 4,
      },
      entryChallenge: {
        submitted: {
          type: Boolean,
          default: false,
        },
        reelUrl: String,
        submittedAt: Date,
        reviewedAt: Date,
        status: {
          type: String,
          enum: ["not_submitted", "pending", "approved", "rejected"],
          default: "not_submitted",
        },
        reviewNotes: String,
      },
      brainGym: {
        completed: {
          type: Boolean,
          default: false,
        },
        answer: String,
        completedAt: Date,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      joinedAt: Date,
    },
  },
  { timestamps: true }
);

// Compound index
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
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  return this.save();
};

// ✅ Ambassador helper methods
KidProfileSchema.methods.awardSwagoMoney = function(amount: number, reason: string) {
  this.ambassador.swagoMoney += amount;
  this.ambassador.totalEarnings += amount;
  // You can log transaction here if needed
  return this.save();
};

KidProfileSchema.methods.awardBadge = function(badgeName: string) {
  const existingBadge = this.ambassador.badges.find((b: { name: string }) => b.name === badgeName);
  if (!existingBadge) {
    this.ambassador.badges.push({ name: badgeName, awardedAt: new Date() });
  }
  return this.save();
};

// ✅ FIXED: Initialize ambassador with currentStep = 2
KidProfileSchema.methods.initializeAmbassador = function() {
  if (!this.ambassador.isAmbassador) {
    this.ambassador.isAmbassador = true;
    this.ambassador.status = "profile_created";
    this.ambassador.swagoMoney = 50; // Initial reward
    this.ambassador.totalEarnings = 50;
    this.ambassador.currentStep = 2; // ✅ FIX: Changed from 1 to 2 to unlock Entry Challenge
    this.ambassador.joinedAt = new Date();
    this.ambassador.badges = [{ name: "Swago Saviour", awardedAt: new Date() }];
    this.ambassador.entryChallenge = {
      submitted: false,
      status: "not_submitted",
    };
    this.ambassador.brainGym = {
      completed: false,
    };
  }
  return this.save();
};

const KidProfile =
  mongoose.models.KidProfile || mongoose.model("KidProfile", KidProfileSchema);

export default KidProfile;
