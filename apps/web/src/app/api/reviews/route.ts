import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Review, User, Order } from "@swago/database";
import mongoose from "mongoose";
import { analyzeReviewSentiment } from "@swago/utils";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1, "Order ID is required"),
  rating: z.number().min(1).max(5),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  comment: z.string().trim().min(10, "Comment must be at least 10 characters").max(1000),
  images: z.array(z.string().url()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { productId, orderId, rating, title, comment, images } = validation.data;

    await connectDB();

    // 🔧 HOTFIX: Force re-compile model if schema changed but server didn't restart
    // This fixes "Cast to Number failed" error by removing stale model
    if (mongoose.models.Review) {
      delete mongoose.models.Review;
    }

    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify order exists and belongs to user
    const order = await Order.findOne({
      _id: orderId,
      phone: session.phone,
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      userId: user._id,
      productId: productId,
    });
    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    // ✅ AI Sentiment Analysis (internal logging only)
    console.log("🤖 Analyzing sentiment with GPT-4o-mini...");
    const sentiment = await analyzeReviewSentiment(title, comment);
    console.log("📊 Sentiment Result:", {
      label: sentiment.label,
      confidence: sentiment.confidence,
      reasoning: sentiment.reasoning,
      autoApproved: sentiment.isPositive
    });

    // ✅ Auto-approve if positive/neutral, pending if negative
    const status = sentiment.isPositive ? "approved" : "pending";

    // Create review with sentiment metadata
    const review = await Review.create({
      productId,
      userId: user._id,
      orderId,
      rating,
      title,
      comment,
      images: images || [],
      status,
      isVerifiedPurchase: true,
      // Store AI analysis results (for admin dashboard)
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.confidence,
      sentimentReasoning: sentiment.reasoning,
    });

    // ✅ ALWAYS return the same message to customer (hide AI logic)
    return NextResponse.json(
      {
        success: true,
        review: {
          _id: review._id,
          productId: review.productId,
          rating: review.rating,
        },
        message: "Review submitted successfully!", // ← Generic message always
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);

    // Check if it's a MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    return NextResponse.json({ error: (error as Error).message || "Internal Server Error" }, { status: 500 });
  }
}

// GET route remains the same
export async function GET() {
  try {
    await connectDB();

    const reviews = await Review.find({ status: "approved" })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}