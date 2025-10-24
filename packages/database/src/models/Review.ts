import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    productId: { 
      type: Number, 
      required: true,
      index: true // For fast product lookup
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Order",
      required: true // Ensures verified purchase
    },
    
    // Review content
    rating: { 
      type: Number, 
      required: true,
      min: 1,
      max: 5 
    },
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    comment: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 1000
    },
    
    // Optional features
    images: [{ 
      type: String 
    }],
    
    // Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    
    // Engagement
    helpfulCount: { 
      type: Number, 
      default: 0 
    },
    
    // Verification badge
    isVerifiedPurchase: {
      type: Boolean,
      default: true // Since we check orderId
    },

    // ✅ NEW: AI Sentiment Analysis Metadata
    sentimentLabel: {
      type: String,
      enum: ["POSITIVE", "NEGATIVE", "NEUTRAL"],
    },
    sentimentScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    sentimentReasoning: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
ReviewSchema.index({ productId: 1, status: 1 }); // Get approved reviews for a product
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true }); // One review per user per product
ReviewSchema.index({ orderId: 1 }); // Check if order already reviewed
ReviewSchema.index({ status: 1, createdAt: -1 }); // Admin moderation queue

const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
export default Review;