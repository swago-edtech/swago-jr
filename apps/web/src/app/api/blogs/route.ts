// apps/web/src/app/api/blogs/route.ts
import { NextResponse } from "next/server";
import { Blog, connectDB } from "@swago/database";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, blogs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
