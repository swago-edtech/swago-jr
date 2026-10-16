import { NextRequest, NextResponse } from "next/server";
import { HowToPlay, connectDB } from "@swago/database";
import { requireAdmin } from "@/lib/auth";
import { howToPlayErrorResponse, parseHowToPlayInput, slugTakenResponse } from "@/lib/how-to-play";

// GET all how-to-play videos
export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const videos = await HowToPlay.find()
      .populate("productId", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, videos });
  } catch (error: any) {
    console.error("Error fetching how-to-play videos:", error);
    return howToPlayErrorResponse(error, "Failed to fetch videos");
  }
}

// POST new how-to-play video
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectDB();

    const parsed = parseHowToPlayInput(await req.json());
    if (!parsed.ok) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    if (await HowToPlay.exists({ slug: parsed.fields.slug })) {
      return slugTakenResponse(parsed.fields.slug);
    }

    const video = await HowToPlay.create(parsed.fields);

    return NextResponse.json({ success: true, video, message: "Video added" });
  } catch (error: any) {
    console.error("Error creating how-to-play video:", error);
    return howToPlayErrorResponse(error, "Failed to create video");
  }
}
