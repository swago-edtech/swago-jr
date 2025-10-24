import { NextResponse } from "next/server";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Review, User } from "@swago/database";
import { z } from "zod";

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  title: z.string().trim().min(3).max(100).optional(),
  comment: z.string().trim().min(10).max(1000).optional(),
  images: z.array(z.string().url()).optional(),
});

/**
 * PUT - Edit own review
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validation = updateReviewSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find review and verify ownership
    const review = await Review.findOne({ _id: id, userId: user._id });
    if (!review) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    // Check if review is within edit window (7 days)
    const daysSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7) {
      return NextResponse.json({ error: "Edit period has expired (7 days)" }, { status: 403 });
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { 
        ...validation.data,
        status: "pending" // Reset to pending after edit
      },
      { new: true }
    );

    return NextResponse.json({ 
      success: true, 
      review: updatedReview,
      message: "Review updated! It will be re-reviewed by admin."
    });

  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE - Delete own review
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const user = await User.findOne({ phone: session.phone });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find and delete review (only if user owns it)
    const review = await Review.findOneAndDelete({ _id: id, userId: user._id });
    if (!review) {
      return NextResponse.json({ error: "Review not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Review deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}