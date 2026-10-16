// apps/admin/app/api/influencers/[id]/route.ts

import { NextResponse } from "next/server";
import { connectDB, InfluencerCreator } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const update: Record<string, unknown> = {};
    if (body.handle !== undefined) update.handle = String(body.handle).replace(/^@/, "").trim();
    if (body.displayName !== undefined) update.displayName = String(body.displayName).trim();
    if (body.platform !== undefined) update.platform = body.platform;
    if (body.feeInr !== undefined) update.feeInr = Number(body.feeInr) || 0;
    if (body.productCostInr !== undefined) update.productCostInr = Number(body.productCostInr) || 0;
    if (body.defaultCampaign !== undefined) update.defaultCampaign = String(body.defaultCampaign || "").trim();
    if (body.notes !== undefined) update.notes = String(body.notes || "").trim();
    if (body.isActive !== undefined) update.isActive = !!body.isActive;

    const creator = await InfluencerCreator.findByIdAndUpdate(id, update, { new: true });
    if (!creator) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, creator });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    await connectDB();
    const { id } = await params;
    await InfluencerCreator.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
