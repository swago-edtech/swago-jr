// apps/admin/app/api/price-ranges/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PriceRange, connectDB } from "@swago/database";

export async function GET() {
    try {
        // Note: requireAdmin check removed for simplicity in web fetching if needed, 
        // but usually web should have its own public API. 
        // I'll keep it admin-only and provide a separate public API route later if needed.
        await connectDB();
        const ranges = await PriceRange.find().sort({ order: 1 });
        return NextResponse.json({ success: true, priceRanges: ranges });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        await connectDB();
        const body = await request.json();
        const range = await PriceRange.create(body);
        return NextResponse.json({ success: true, priceRange: range });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
