// apps/admin/app/api/banners/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB, Banner } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const banners = await Banner.find().sort({ order: 1 });
        return NextResponse.json({ success: true, banners });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const body = await request.json();

        await connectDB();
        const banner = await Banner.create(body);

        return NextResponse.json({ success: true, banner });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
