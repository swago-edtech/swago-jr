import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Review, User, Order } from "@swago/database";
import { analyzeReviewSentiment } from "@swago/utils"; // ✅ NEW IMPORT
import { z } from "zod";

const reviewSchema = z.object({
  productId: z.number().positive(),
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

    // ✅ NEW: AI Sentiment Analysis
    console.log("🤖 Analyzing sentiment with GPT-4o-mini...");
    const sentiment = await analyzeReviewSentiment(title, comment);
    console.log("📊 Result:", sentiment);

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
      // ✅ Store AI analysis results
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.confidence,
      sentimentReasoning: sentiment.reasoning,
    });

    // Custom message based on result
    const message = sentiment.isPositive
      ? "✅ Review approved and published!"
      : `⏳ Review submitted for admin approval. Reason: ${sentiment.reasoning}`;

    return NextResponse.json(
      {
        success: true,
        review,
        message,
        sentiment: {
          label: sentiment.label,
          confidence: sentiment.confidence,
          reasoning: sentiment.reasoning,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);

    // Check if it's a MongoDB duplicate key error
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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