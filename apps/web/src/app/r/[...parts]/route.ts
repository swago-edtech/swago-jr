import { NextRequest, NextResponse } from "next/server";
import { connectDB, InfluencerCreator } from "@swago/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PLACEMENTS = new Set([
  "story",
  "reel",
  "reels",
  "bio",
  "dm",
  "post",
  "group",
  "status",
  "review",
  "description",
  "ad",
  "feed",
  "live",
  "short",
  "video",
  "link",
]);

function cleanSegment(value: string | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64);
}

/**
 * Short masked creator links for collabs.
 *
 *   /r/{creatorId}              → home + UTMs (default placement = story)
 *   /r/{creatorId}/{placement}  → same with utm_term = placement
 *   /r/{creatorId}?p=reel&c=spring_launch  → optional overrides
 *
 * Expands to full UTM query so AttributionCapture + GA still see standard params.
 * Looks up InfluencerCreator when available for platform / defaultCampaign.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ parts?: string[] }> | { parts?: string[] } }
) {
  const resolved = await context.params;
  const parts = Array.isArray(resolved?.parts) ? resolved.parts : [];
  const creatorId = cleanSegment(parts[0]);
  const placementFromPath = cleanSegment(parts[1]);

  if (!creatorId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const sp = request.nextUrl.searchParams;
  const placementOverride = cleanSegment(sp.get("p") || sp.get("placement") || "");
  const campaignOverride = (sp.get("c") || sp.get("campaign") || "").trim().slice(0, 80);
  const destination = (sp.get("to") || sp.get("path") || "/").trim() || "/";

  let platform = "instagram";
  let campaign = "collab";
  let isActive = true;

  try {
    await connectDB();
    const creator = (await InfluencerCreator.findOne({ creatorId })
      .select("platform defaultCampaign isActive creatorId")
      .lean()) as
      | {
          platform?: string;
          defaultCampaign?: string;
          isActive?: boolean;
          creatorId?: string;
        }
      | null;
    if (creator) {
      platform = creator.platform || platform;
      campaign = creator.defaultCampaign || campaign;
      isActive = creator.isActive !== false;
    }
  } catch {
    // Still expand UTMs even if DB is briefly unavailable
  }

  if (campaignOverride) campaign = campaignOverride;

  let term = placementOverride || placementFromPath || "story";
  if (term === "reels") term = "reel";
  if (!ALLOWED_PLACEMENTS.has(term)) term = "story";

  // Only allow same-origin relative destinations (/, /products, /product/..)
  let destPath = destination.startsWith("/") ? destination.split("?")[0] : "/";
  if (destPath.startsWith("//") || destPath.includes("://")) destPath = "/";

  const target = new URL(destPath, request.url);
  target.searchParams.set("utm_source", platform || "instagram");
  target.searchParams.set("utm_medium", "influencer");
  target.searchParams.set("utm_campaign", campaign || "collab");
  target.searchParams.set("utm_content", creatorId);
  target.searchParams.set("utm_term", term);
  // marker so we can debug short-link traffic in logs/GA if needed
  target.searchParams.set("ref", "r");
  if (!isActive) {
    // still attribute — paused creators may have residual posts
    target.searchParams.set("sw_creator_status", "inactive");
  }

  return NextResponse.redirect(target, 302);
}
