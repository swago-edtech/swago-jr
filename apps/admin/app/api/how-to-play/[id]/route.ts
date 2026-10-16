import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { HowToPlay, connectDB } from "@swago/database";
import { requireAdmin } from "@/lib/auth";
import { howToPlayErrorResponse, parseHowToPlayInput, slugTakenResponse } from "@/lib/how-to-play";

type RouteContext = { params: Promise<{ id: string }> };

function notFoundResponse(): NextResponse {
  return NextResponse.json({ success: false, error: "Video not found" }, { status: 404 });
}

// PUT update how-to-play video
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!isValidObjectId(id)) return notFoundResponse();

    const parsed = parseHowToPlayInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    await connectDB();

    if (await HowToPlay.exists({ slug: parsed.fields.slug, _id: { $ne: id } })) {
      return slugTakenResponse(parsed.fields.slug);
    }

    const video = await HowToPlay.findByIdAndUpdate(id, parsed.fields, {
      new: true,
      runValidators: true,
    });
    if (!video) return notFoundResponse();

    return NextResponse.json({ success: true, video, message: "Video updated" });
  } catch (error: any) {
    console.error("Error updating how-to-play video:", error);
    return howToPlayErrorResponse(error, "Failed to update video");
  }
}

// DELETE how-to-play video
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();

    const { id } = await params;
    if (!isValidObjectId(id)) return notFoundResponse();

    await connectDB();

    const video = await HowToPlay.findByIdAndDelete(id);
    if (!video) return notFoundResponse();

    return NextResponse.json({ success: true, message: "Video deleted" });
  } catch (error: any) {
    console.error("Error deleting how-to-play video:", error);
    return howToPlayErrorResponse(error, "Failed to delete video");
  }
}
