import mongoose from "mongoose";

const FAQSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      minlength: [10, "Question must be at least 10 characters"],
      maxlength: [500, "Question cannot exceed 500 characters"]
    },

    answer: {
      type: String,
      required: [true, "Answer is required"],
      minlength: [20, "Answer must be at least 20 characters"]
    },

    category: {
      type: String,
      enum: {
        values: ["general", "shipping", "payment", "products", "returns", "account"],
        message: "Category must be one of: general, shipping, payment, products, returns, account"
      },
      required: [true, "Category is required"],
      default: "general"
    },

    order: {
      type: Number,
      default: 0,
      min: [0, "Order cannot be negative"]
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
FAQSchema.index({ isActive: 1, order: 1 });
FAQSchema.index({ category: 1, isActive: 1 });
FAQSchema.index({ category: 1, order: 1 });

// Text search index for question
FAQSchema.index({ question: "text", answer: "text" });

export default mongoose.models.FAQ || mongoose.model("FAQ", FAQSchema);
