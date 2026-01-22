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
    gender: {
      type: String,
      enum: ["boy", "girl", "other"],
      default: "other",
    },
    // ⚠️ DEPRECATED: PIN fields kept for backward compatibility only
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
    // ⚠️ DEPRECATED: Product unlock fields kept for backward compatibility only
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
    // ✅ Ambassador Program Fields (ACTIVE)
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
        default: 1,
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
    
    // 🆕 NEW: Lottery Tickets
    lotteryTickets: [{
      codeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "LotteryCode",
        required: true 
      },
      code: { 
        type: String,
        required: true,
        uppercase: true,
      },
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product",
        required: true 
      },
      productName: {
        type: String,
        required: true
      },
      shortForm: {
        type: String,
        required: true,
        uppercase: true,
      },
      ticketType: {
        type: String,
        enum: ["Golden Ticket", "Diamond Ticket"],
        required: true
      },
      swagoMoneyEarned: {
        type: Number,
        default: 10
      },
      redeemedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
  },
  { timestamps: true }
);

// ❌ REMOVED: .index() call
// Indexes are now created manually via migration scripts

// ✅ Ambassador helper methods (KEEP - these are instance methods, not indexes)
KidProfileSchema.methods.awardSwagoMoney = function(amount: number, reason: string) {
  this.ambassador.swagoMoney += amount;
  this.ambassador.totalEarnings += amount;
  return this.save();
};

KidProfileSchema.methods.awardBadge = function(badgeName: string) {
  const existingBadge = this.ambassador.badges.find((b: { name: string }) => b.name === badgeName);
  if (!existingBadge) {
    this.ambassador.badges.push({ name: badgeName, awardedAt: new Date() });
  }
  return this.save();
};

KidProfileSchema.methods.initializeAmbassador = function() {
  if (!this.ambassador.isAmbassador) {
    this.ambassador.isAmbassador = true;
    this.ambassador.status = "profile_created";
    this.ambassador.swagoMoney = 20;
    this.ambassador.totalEarnings = 20;
    this.ambassador.currentStep = 2;
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

// 🆕 NEW: Lottery redemption helper method
KidProfileSchema.methods.redeemLotteryCode = function(codeData: {
  codeId: any;
  code: string;
  productId: any;
  productName: string;
  shortForm: string;
  ticketType: string;
}) {
  const reward = 10; // Fixed reward for now
  
  // Initialize ambassador object if it doesn't exist
  if (!this.ambassador) {
    this.ambassador = {
      isAmbassador: false,
      status: "not_started",
      swagoMoney: 0,
      totalEarnings: 0,
      badges: [],
      currentStep: 1,
      entryChallenge: {
        submitted: false,
        status: "not_submitted",
      },
      brainGym: {
        completed: false,
      },
    };
  }
  
  // Add ticket to lotteryTickets array
  if (!this.lotteryTickets) {
    this.lotteryTickets = [];
  }
  
  this.lotteryTickets.push({
    codeId: codeData.codeId,
    code: codeData.code,
    productId: codeData.productId,
    productName: codeData.productName,
    shortForm: codeData.shortForm,
    ticketType: codeData.ticketType,
    swagoMoneyEarned: reward,
    redeemedAt: new Date(),
  });
  
  // Award Swago Money
  this.ambassador.swagoMoney += reward;
  this.ambassador.totalEarnings += reward;
  
  return this.save();
};

const KidProfile =
  mongoose.models.KidProfile || mongoose.model("KidProfile", KidProfileSchema);

export default KidProfile;
