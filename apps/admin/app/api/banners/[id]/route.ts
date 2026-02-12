// apps/admin/app/api/banners/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB, Banner } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await connectDB();
        const banner = await Banner.findById(id);
        if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });
        return NextResponse.json({ success: true, banner });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;
        const body = await request.json();

        await connectDB();
        const banner = await Banner.findByIdAndUpdate(id, body, { new: true });
        if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });

        return NextResponse.json({ success: true, banner });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;

        await connectDB();
        const banner = await Banner.findByIdAndDelete(id);
        if (!banner) return NextResponse.json({ error: "Banner not found" }, { status: 404 });

        return NextResponse.json({ success: true, message: "Banner deleted" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
