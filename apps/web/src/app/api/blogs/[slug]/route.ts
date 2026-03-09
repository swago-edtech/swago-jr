// apps/web/src/app/api/blogs/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Blog, connectDB } from "@swago/database";
import { CHILD_BRAIN_QUIZ_BLOG } from "@/data/blogData";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Force use of code-based data for the child brain quiz to allow instant updates
        if (slug === "child-brain-quiz") {
            return NextResponse.json({ success: true, blog: CHILD_BRAIN_QUIZ_BLOG });
        }

        await connectDB();
        const blog = await Blog.findOne({ slug, isPublished: true });
        if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
        return NextResponse.json({ success: true, blog });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
