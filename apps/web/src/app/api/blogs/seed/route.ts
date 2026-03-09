// apps/web/src/app/api/blogs/seed/route.ts
import { NextResponse } from "next/server";
import { Blog, connectDB } from "@swago/database";
import { CHILD_BRAIN_QUIZ_BLOG } from "@/data/blogData";

export async function GET() {
    try {
        await connectDB();

        // Delete existing blog with this slug so we can refresh the content
        await Blog.deleteOne({ slug: "child-brain-quiz" });

        const blog = await Blog.create(CHILD_BRAIN_QUIZ_BLOG);
        return NextResponse.json({ success: true, blog });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
