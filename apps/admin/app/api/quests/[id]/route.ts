// apps/admin/app/api/quests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB, Quest } from "@swago/database";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id } = params;
        await Quest.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const { id } = params;
        const data = await req.json();
        const quest = await Quest.findByIdAndUpdate(id, data, { new: true });
        return NextResponse.json({ success: true, quest });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
