// apps/admin/app/api/influencers/route.ts

import { NextResponse } from "next/server";
import { connectDB, InfluencerCreator } from "@swago/database";
import { requireAdmin } from "@/lib/auth";

function slugifyCreatorId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  try {
    await requireAdmin();
    await connectDB();
    const creators = await InfluencerCreator.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, creators });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    await connectDB();
    const body = await req.json();

    const handle = String(body.handle || "").trim();
    if (!handle) {
      return NextResponse.json({ success: false, error: "Handle is required" }, { status: 400 });
    }

    const creatorId = slugifyCreatorId(body.creatorId || handle);
    if (!creatorId) {
      return NextResponse.json({ success: false, error: "Invalid creatorId" }, { status: 400 });
    }

    const existing = await InfluencerCreator.findOne({ creatorId });
    if (existing) {
      return NextResponse.json({ success: false, error: "creatorId already exists" }, { status: 400 });
    }

    const creator = await InfluencerCreator.create({
      creatorId,
      handle: handle.replace(/^@/, ""),
      displayName: body.displayName || handle,
      platform: body.platform || "instagram",
      feeInr: Number(body.feeInr) || 0,
      productCostInr: Number(body.productCostInr) || 0,
      defaultCampaign: body.defaultCampaign || "",
      notes: body.notes || "",
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, creator });
  } catch (error: any) {
    const status = error?.message?.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}
