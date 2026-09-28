import { NextResponse } from "next/server";
import { getYouTubeVideoId, slugify } from "@swago/utils";
import { isValidObjectId } from "mongoose";

export type HowToPlayFields = {
  slug: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  description: string;
  productId: string | null;
  isActive: boolean;
};

type ParseResult = { ok: true; fields: HowToPlayFields } | { ok: false; error: string };

export function slugTakenResponse(slug: string): NextResponse {
  return NextResponse.json(
    { success: false, error: `Route /how-to-play/${slug} is already used` },
    { status: 409 }
  );
}

export function howToPlayErrorResponse(error: any, fallback: string): NextResponse {
  if (error.code === 11000) {
    return slugTakenResponse(error.keyValue?.slug ?? "");
  }
  const status = error.message?.includes("Unauthorized") ? 401 : 500;
  return NextResponse.json({ success: false, error: error.message || fallback }, { status });
}

export function parseHowToPlayInput(body: Record<string, unknown>): ParseResult {
  const title = String(body.title ?? "").trim();
  const slug = slugify(String(body.slug ?? "") || title);
  const youtubeUrl = String(body.youtubeUrl ?? "").trim();
  const productId = body.productId ? String(body.productId) : null;

  if (!title) return { ok: false, error: "Title is required" };
  if (!slug) return { ok: false, error: "Route slug is required" };

  const youtubeVideoId = getYouTubeVideoId(youtubeUrl);
  if (!youtubeVideoId) {
    return { ok: false, error: "Enter a valid YouTube link (watch, youtu.be or shorts URL)" };
  }

  if (productId && !isValidObjectId(productId)) {
    return { ok: false, error: "Invalid product selected" };
  }

  return {
    ok: true,
    fields: {
      slug,
      title,
      youtubeUrl,
      youtubeVideoId,
      description: String(body.description ?? "").trim(),
      productId,
      isActive: body.isActive !== false,
    },
  };
}
