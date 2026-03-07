// apps/web/src/app/api/price-ranges/route.ts
import { NextResponse } from "next/server";
import { PriceRange, connectDB } from "@swago/database";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const ranges = await PriceRange.find({ isActive: true }).sort({ order: 1 });
        return NextResponse.json({ success: true, priceRanges: ranges });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
