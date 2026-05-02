// packages/database/src/models/User.ts

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    
    // Sparse unique indexes allow null values (admin has no phone, customer has no email)
    phone: { 
      type: String, 
    },
    
    email: { 
      type: String, 
    },
    
    // ✅ Track authentication method
    authMethod: {
      type: String,
      enum: ['phone', 'email'],
      required: false  // Existing users don't have this
    },
    
    // Admin fields
    password: { type: String },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    
    // Customer fields
    wishlist: [{ 
      type: mongoose.Schema.Types.Mixed,  // Supports both Number and String
    }],
    
    // ✅ Cart field with full product details
    cart: [{
      productId: { 
        type: mongoose.Schema.Types.Mixed,
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true,
        min: 1,
        default: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      name: {
        type: String,
        required: true
      },
      image: {
        type: String,
        required: true
      },
      images: [String],
      addedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    
    age: { type: Number },
    dob: { type: Date },
    gender: {
      type: String,
      enum: ["boy", "girl", "other"],
    },
    avatar: {
      type: String, // Image path for profile display
    },
    grade: {
      type: String,
      enum: [
        "Pre-K", "Kindergarten",
        "Grade 1", "Grade 2", "Grade 3", "Grade 4",
        "Grade 5", "Grade 6", "Grade 7", "Grade 8",
      ],
    },
    address: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    
    // ✅ Ambassador Program Fields (migrated from KidProfile)
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
        instagramUsername: String,
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
        reelUrl: String,
        instagramUsername: String,
        submittedAt: Date,
        reviewedAt: Date,
        status: {
          type: String,
          enum: ["not_submitted", "pending", "approved", "rejected"],
          default: "not_submitted",
        },
        reviewNotes: String,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      joinedAt: Date,
      profileSetupRewardClaimed: {
        type: Boolean,
        default: false,
      },
    },

    // ✅ Lottery Tickets (migrated from KidProfile)
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
        required: true
      },
      swagoMoneyEarned: {
        type: Number,
        default: 20
      },
      redeemedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // ✅ Legacy field kept for backward compatibility
    swagoMoney: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ✅ Keep swagoMoney and ambassador.swagoMoney in sync
UserSchema.pre('save', function(next) {
  if (this.ambassador && this.ambassador.swagoMoney !== undefined) {
    this.swagoMoney = this.ambassador.swagoMoney;
  } else if (this.swagoMoney !== undefined) {
    if (!this.ambassador) this.ambassador = {} as any;
    this.ambassador!.swagoMoney = this.swagoMoney;

  }
  next();
});


// ✅ Ambassador helper methods (migrated from KidProfile)
UserSchema.methods.awardSwagoMoney = function (amount: number, _reason: string) {
  if (!this.ambassador) this.ambassador = {} as any;
  this.ambassador!.swagoMoney = (this.ambassador!.swagoMoney || 0) + amount;
  this.ambassador!.totalEarnings = (this.ambassador!.totalEarnings || 0) + amount;
  return this.save();
};

UserSchema.methods.awardBadge = function (badgeName: string) {
  if (!this.ambassador) this.ambassador = {} as any;

  if (!this.ambassador!.badges) this.ambassador!.badges = [];
  const existingBadge = this.ambassador!.badges.find((b: { name: string }) => b.name === badgeName);

  if (!existingBadge) {
    this.ambassador.badges.push({ name: badgeName, awardedAt: new Date() });
  }
  return this.save();
};

UserSchema.methods.initializeAmbassador = function () {
  if (!this.ambassador) this.ambassador = {} as any;

  if (!this.ambassador!.isAmbassador) {
    this.ambassador!.isAmbassador = true;
    this.ambassador!.status = "profile_created";
    this.ambassador!.swagoMoney = 0;
    this.ambassador!.totalEarnings = 0;
    this.ambassador!.currentStep = 2;
    this.ambassador!.joinedAt = new Date();
    this.ambassador!.badges = [{ name: "Swago Saviour", awardedAt: new Date() }];
    this.ambassador!.entryChallenge = {
      submitted: false,
      status: "not_submitted",
    };
    this.ambassador!.brainGym = {
      completed: false,
    };
  }
  return this.save();
};


// ✅ Lottery redemption helper method (migrated from KidProfile)
UserSchema.methods.redeemLotteryCode = function (codeData: {
  codeId: any;
  code: string;
  productId: any;
  productName: string;
  shortForm: string;
  ticketType: string;
}) {
  const reward = 10;
  if (!this.ambassador) {
    this.ambassador = {} as any;
  }

  if (this.ambassador!.isAmbassador === undefined) {
    this.ambassador!.isAmbassador = false;
  }
  if (!this.ambassador!.status) {
    this.ambassador!.status = "not_started";
  }
  if (this.ambassador!.swagoMoney === undefined) {
    this.ambassador!.swagoMoney = 0;
  }
  if (this.ambassador!.totalEarnings === undefined) {
    this.ambassador!.totalEarnings = 0;
  }
  if (!this.ambassador!.badges) {
    this.ambassador!.badges = [];
  }
  if (this.ambassador!.currentStep === undefined) {
    this.ambassador!.currentStep = 1;
  }
  if (!this.ambassador!.entryChallenge) {
    this.ambassador!.entryChallenge = { submitted: false, status: "not_submitted" };
  }
  if (!this.ambassador!.brainGym) {
    this.ambassador!.brainGym = { completed: false };
  }

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

  this.ambassador!.swagoMoney += reward;
  this.ambassador!.totalEarnings += reward;

  this.checkAndAwardAmbassadorBadge();

  return this.save();
};

// ✅ Check and award Brand Ambassador badge at 200 Swago Money threshold
UserSchema.methods.checkAndAwardAmbassadorBadge = function () {
  if (this.ambassador && this.ambassador!.swagoMoney >= 200) {
    const hasBadge = this.ambassador!.badges.some((b: { name: string }) => b.name === "Brand Ambassador");
    if (!hasBadge) {
      this.ambassador!.badges.push({
        name: "Brand Ambassador",
        awardedAt: new Date()
      });
      this.ambassador!.status = "brand_ambassador";
      this.ambassador!.currentStep = 4;
      console.log(`🎉 Brand Ambassador badge awarded! Swago Money: ${this.ambassador!.swagoMoney}`);
    }
  }
};


const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
