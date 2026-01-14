import mongoose from "mongoose";

const AmbassadorApplicationSchema = new mongoose.Schema(
  {
    // Kid Details
    kidName: { 
      type: String, 
      required: true 
    },
    kidAge: { 
      type: Number, 
      required: true,
      min: 7,
      max: 14
    },
    city: { 
      type: String, 
      required: true 
    },
    
    // Parent Details
    parentName: { 
      type: String, 
      required: true 
    },
    parentEmail: { 
      type: String, 
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    parentPhone: { 
      type: String, 
      required: true 
    },
    
    // Optional Content
    whyJoin: { 
      type: String 
    },
    
    // Metadata
    status: { 
      type: String,
      enum: ['pending', 'under_review', 'shortlisted', 'selected', 'rejected'],
      default: 'pending'
    },
    consentGiven: { 
      type: Boolean, 
      default: true 
    },
    
    // Admin Notes (for future)
    adminNotes: { 
      type: String 
    },
    reviewedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    reviewedAt: { 
      type: Date 
    },
  },
  { timestamps: true }
);

// Indexes
AmbassadorApplicationSchema.index({ status: 1, createdAt: -1 });
AmbassadorApplicationSchema.index({ createdAt: -1 });

export default mongoose.models.AmbassadorApplication || 
  mongoose.model("AmbassadorApplication", AmbassadorApplicationSchema);
