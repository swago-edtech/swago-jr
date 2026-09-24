import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Review, User, Order } from "@swago/database";
import mongoose from "mongoose";
import { analyzeReviewSentiment } from "@swago/utils";
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100),
  comment: z.string().trim().min(10, "Comment must be at least 10 characters").max(1000),
  images: z.array(z.string().url()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    const body = await req.json();

    // Convert empty string orderId to undefined so Zod doesn't complain if it doesn't match ObjectId or whatever, although string() allows it.
    if (body.orderId === "") {
      delete body.orderId;
    }

    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { productId, orderId, rating, title, comment, images } = validation.data;

    await connectDB();

    // 🔧 HOTFIX: Force re-compile model if schema changed
    if (mongoose.models.Review) {
      delete mongoose.models.Review;
    }

    let userId = null;
    let isVerifiedPurchase = false;

    // If logged in, get user and verify order
    if (session) {
      const user = await User.findOne({ phone: session.phone });
      if (user) {
        userId = user._id;

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
          userId: user._id,
          productId: productId,
        });

        if (existingReview) {
          return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
        }

        // Verify order exists and belongs to user if orderId was provided
        if (orderId) {
          const order = await Order.findOne({
            _id: orderId,
            phone: session.phone,
          });
          if (order) {
            isVerifiedPurchase = true;
          }
        }
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "You must be logged in to leave a review" }, { status: 401 });
    }

    // ✅ AI Sentiment Analysis (internal logging only)
    console.log("🤖 Analyzing sentiment with Gemini...");
    const sentiment = await analyzeReviewSentiment(title, comment);
    console.log("📊 Sentiment Result:", {
      label: sentiment.label,
      confidence: sentiment.confidence,
      reasoning: sentiment.reasoning,
      rating: rating
    });

    // ✅ Requirement: Negative reviews (< 3 stars OR negative label) go to admin (pending)
    const isNegative = rating < 3 || sentiment.label === "NEGATIVE";
    const status = isNegative ? "pending" : "approved";

    // Create review with sentiment metadata
    const review = await Review.create({
      productId,
      userId,
      ...(orderId ? { orderId } : {}),
      rating,
      title,
      comment,
      images: images || [],
      status,
      isVerifiedPurchase,
      // Store AI analysis results (for admin dashboard)
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.confidence,
      sentimentReasoning: sentiment.reasoning,
    });

    // ✅ ALWAYS return a polite generic message to customer
    return NextResponse.json(
      {
        success: true,
        review: {
          _id: review._id,
          productId: review.productId,
          rating: review.rating,
        },
        message: status === "pending"
          ? "Thank you for your feedback! It has been submitted for review."
          : "Review submitted successfully!",
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