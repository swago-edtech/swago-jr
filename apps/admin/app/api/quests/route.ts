// apps/admin/app/api/quests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, Quest, Product } from "@swago/database";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        let query = {};
        if (productId) {
            query = { productId };
        }

        const quests = await Quest.find(query).populate("productId", "name").sort({ createdAt: -1 });
        return NextResponse.json({ success: true, quests });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const data = await req.json();

        if (!data.title || !data.productId || !data.image) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const quest = await Quest.create(data);
        return NextResponse.json({ success: true, quest });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
