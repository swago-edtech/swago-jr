import { NextRequest, NextResponse } from "next/server";
import { FAQ, connectDB } from "@swago/database";

// GET all active FAQs (public endpoint - no auth required)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Build query - only fetch active FAQs
    const query: Record<string, unknown> = { isActive: true }; // ✅ FIXED: any -> Record<string, unknown>

    // Filter by category if provided
    if (category && category !== "all") {
      query.category = category;
    }

    // Fetch FAQs sorted by order, then creation date
    const faqs = await FAQ.find(query)
      .sort({ order: 1, createdAt: -1 })
      .select("-__v"); // Exclude version key

    // Group by category for easier frontend consumption
    const groupedByCategory = faqs.reduce((acc: Record<string, unknown[]>, faq: Record<string, unknown>) => { // ✅ FIXED: Added proper types
      const faqCategory = faq.category as string;
      if (!acc[faqCategory]) {
        acc[faqCategory] = [];
      }
      acc[faqCategory].push(faq);
      return acc;
    }, {});

    return NextResponse.json(
      {
        success: true,
        faqs,
        groupedByCategory,
        count: faqs.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) { // ✅ FIXED: Removed any type
    console.error("Error fetching FAQs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch FAQs",
      },
      { status: 500 }
    );
  }
}
