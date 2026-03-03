// apps/web/src/app/api/promotion/route.ts

import { NextResponse } from "next/server";
import { connectDB, Promotion } from "@swago/database";

export async function GET() {
    try {
        // The instruction "Fix Coupon to CouponModel in COD route" seems to refer to a different context,
        // as there is no Coupon or CouponModel in this file, and this is a promotion route.
        // The provided "Code Edit" snippet was syntactically incorrect and introduced unrelated code.
        // Therefore, I will only ensure the 'promotion' variable is cast to 'any' as requested,
        // which it already is in the original code.
        await connectDB();

        let promotion: any = await Promotion.findOne({ isActive: true }).lean();

        // Default fallback if database is empty
        if (!promotion) {
            promotion = {
                redemptionTiers: [
                    { target: 799, off: 50 },
                    { target: 1200, off: 75 },
                    { target: 2000, off: 100 },
                    { target: 3000, off: 150 }
                ],
                bonusItems: [
                    { threshold: 999, label: "Mini Swago Game Card", slug: "mini-swago-game-card" },
                    { threshold: 1499, label: "Swago Blind Bag", slug: "swago-blind-bag" },
                    { threshold: 1999, label: "Special Edition Item", slug: "special-edition-item" }
                ]
            };
        }

        return NextResponse.json({ success: true, promotion });
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
