// apps/web/src/app/api/blogs/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Blog, connectDB } from "@swago/database";

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        await connectDB();
        const { slug } = await params;
        const blog = await Blog.findOne({ slug, isPublished: true });
        if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
        return NextResponse.json({ success: true, blog });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
