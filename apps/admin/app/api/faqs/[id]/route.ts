import { NextRequest, NextResponse } from "next/server";
import { FAQ, connectDB } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

// GET single FAQ
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params; // ✅ FIXED: Await params first

    const faq = await FAQ.findById(id);

    if (!faq) {
      return NextResponse.json(
        {
          success: false,
          error: "FAQ not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      faq,
    });
  } catch (error: any) {
    console.error("Error fetching FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch FAQ",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// PUT update FAQ
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params; // ✅ FIXED: Await params first
    const body = await req.json();
    const { question, answer, category, order, isActive } = body;

    // Find FAQ
    const faq = await FAQ.findById(id);

    if (!faq) {
      return NextResponse.json(
        {
          success: false,
          error: "FAQ not found",
        },
        { status: 404 }
      );
    }

    // Update fields
    if (question !== undefined) faq.question = question.trim();
    if (answer !== undefined) faq.answer = answer.trim();
    if (category !== undefined) faq.category = category;
    if (order !== undefined) faq.order = order;
    if (isActive !== undefined) faq.isActive = isActive;

    await faq.save();

    return NextResponse.json({
      success: true,
      faq,
      message: "FAQ updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update FAQ",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// DELETE FAQ
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();

    const { id } = await params; // ✅ FIXED: Await params first

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return NextResponse.json(
        {
          success: false,
          error: "FAQ not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete FAQ",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
