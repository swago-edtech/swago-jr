import { NextRequest, NextResponse } from "next/server";
import { FAQ, connectDB } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

// GET all FAQs (with filters)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    // Build query
    const query: any = {};

    // Search in question and answer
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by active status
    if (isActive && isActive !== "all") {
      query.isActive = isActive === "true";
    }

    // Fetch FAQs sorted by order, then creation date
    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

    return NextResponse.json({
      success: true,
      faqs,
      count: faqs.length,
    });
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch FAQs",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST new FAQ
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const body = await req.json();
    const { question, answer, category, order, isActive } = body;

    // Validate required fields
    if (!question || !answer || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Question, answer, and category are required",
        },
        { status: 400 }
      );
    }

    // Create new FAQ
    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      category,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({
      success: true,
      faq,
      message: "FAQ created successfully",
    });
  } catch (error: any) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create FAQ",
      },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
