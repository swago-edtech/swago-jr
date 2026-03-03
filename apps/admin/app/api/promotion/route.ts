// apps/admin/app/api/promotion/route.ts

import { NextResponse } from "next/server";
import { connectDB, Promotion } from "@swago/database";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        let promotion = await Promotion.findOne({ isActive: true });

        // If no active promotion, create a default one
        if (!promotion) {
            promotion = await Promotion.create({
                name: "Default Promotion",
                isActive: true,
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
            });
        }

        return NextResponse.json({ success: true, promotion });
    } catch (error) {
        console.error("Error fetching promotion:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { redemptionTiers, bonusItems } = body;

        await connectDB();

        const promotion = await Promotion.findOneAndUpdate(
            { isActive: true },
            { redemptionTiers, bonusItems },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, promotion });
    } catch (error) {
        console.error("Error updating promotion:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
