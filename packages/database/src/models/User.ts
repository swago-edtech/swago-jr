// packages/database/src/models/User.ts

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    
    // Sparse unique indexes allow null values (admin has no phone, customer has no email)
    phone: { 
      type: String, 
      // ❌ REMOVED: unique: true,
      // ❌ REMOVED: sparse: true
    },
    
    email: { 
      type: String, 
      // ❌ REMOVED: unique: true,
      // ❌ REMOVED: sparse: true
    },
    
    // ✅ NEW: Track authentication method
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
    
    // ✅ UPDATED: Cart field with full product details
    cart: [{
      productId: { 
        type: mongoose.Schema.Types.Mixed, // Supports both number (1-100) and string (MongoDB ObjectId)
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true,
        min: 1,
        default: 1
      },
      // ✅ NEW: Snapshot product details at add-to-cart time
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
      images: [String], // ✅ NEW: Support full images array
      addedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    
    age: { type: Number },
    address: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    
    // 🆕 NEW: Lottery tickets (redeemed codes)
    lotteryTickets: [{
      codeId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "LotteryCode",
        required: true 
      },
      code: { 
        type: String,
        required: true 
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
        required: true
      },
      redeemedAt: { 
        type: Date, 
        default: Date.now 
      }
    }],
    swagoMoney: {
      type: Number,
      default: 0, // Initial balance
    },
  },
  { timestamps: true }
);

// ❌ REMOVED: All .index() calls
// Indexes are now created manually via migration scripts

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
