// apps/web/src/app/api/banners/route.ts

import { NextResponse } from "next/server";
import { connectDB, Banner } from "@swago/database";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        return NextResponse.json({ success: true, banners });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
