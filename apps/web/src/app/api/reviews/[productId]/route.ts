import { NextResponse } from "next/server";
import { connectDB, Review } from "@swago/database";

interface TransformedReview {
  _id: string;
  productId: number;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  status: "pending" | "approved" | "rejected";
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  sentimentLabel?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  sentimentScore?: number;
  sentimentReasoning?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    phone: string;
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const productIdNum = parseInt(productId);

    if (isNaN(productIdNum)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    await connectDB();

    // Get approved reviews with user info
    const reviews = await Review.find({ 
      productId: productIdNum,
      status: "approved" 
    })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 })
      .lean(); // ✅ Convert to plain objects

    // ✅ Transform data to match component expectations
    const transformedReviews: TransformedReview[] = reviews.map((review) => {
      // Use type assertion to unknown first, then to our expected type
      const reviewData = review as unknown as {
        _id: { toString(): string } | string;
        productId: number;
        rating: number;
        title: string;
        comment: string;
        images?: string[];
        status: "pending" | "approved" | "rejected";
        helpfulCount?: number;
        isVerifiedPurchase?: boolean;
        sentimentLabel?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
        sentimentScore?: number;
        sentimentReasoning?: string;
        createdAt: Date;
        updatedAt: Date;
        userId?: {
          name?: string;
          phone?: string;
        } | null;
      };

      return {
        _id: typeof reviewData._id === 'string' ? reviewData._id : reviewData._id.toString(),
        productId: reviewData.productId,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        images: reviewData.images || [],
        status: reviewData.status,
        helpfulCount: reviewData.helpfulCount || 0,
        isVerifiedPurchase: reviewData.isVerifiedPurchase || false,
        sentimentLabel: reviewData.sentimentLabel,
        sentimentScore: reviewData.sentimentScore,
        sentimentReasoning: reviewData.sentimentReasoning,
        createdAt: reviewData.createdAt,
        updatedAt: reviewData.updatedAt,
        user: {
          name: reviewData.userId?.name || "Anonymous",
          phone: reviewData.userId?.phone || "Anonymous",
        },
      };
    });

    // Calculate review stats
    const totalReviews = transformedReviews.length;
    const averageRating = totalReviews > 0
      ? transformedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      5: transformedReviews.filter((r) => r.rating === 5).length,
      4: transformedReviews.filter((r) => r.rating === 4).length,
      3: transformedReviews.filter((r) => r.rating === 3).length,
      2: transformedReviews.filter((r) => r.rating === 2).length,
      1: transformedReviews.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      stats: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingDistribution
      }
    });

  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}