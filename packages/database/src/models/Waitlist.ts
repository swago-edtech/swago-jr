import mongoose from "mongoose";

const WaitlistSchema = new mongoose.Schema(
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
    
    // Parent Details
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
    
    // Metadata
    notified: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

// Indexes
WaitlistSchema.index({ notified: 1, createdAt: -1 });
WaitlistSchema.index({ createdAt: -1 });

export default mongoose.models.Waitlist || 
  mongoose.model("Waitlist", WaitlistSchema);
