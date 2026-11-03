/** Shared helpers for influencer collab links (admin UI). */

export const CREATOR_PLACEMENTS = [
  { id: "story", label: "Story" },
  { id: "reel", label: "Reel" },
  { id: "bio", label: "Bio" },
  { id: "dm", label: "DM" },
  { id: "post", label: "Post" },
  { id: "review", label: "Review" },
  { id: "group", label: "Group" },
] as const;

export type CreatorLinkInput = {
  creatorId: string;
  platform?: string;
  defaultCampaign?: string;
  placement?: string;
  /** Absolute site origin, e.g. https://swagojr.com */
  siteOrigin?: string;
  /** Optional landing path, default / */
  path?: string;
};

export function getSiteOrigin(fallback = "https://swagojr.com"): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  return fallback.replace(/\/$/, "");
}

/**
 * Short masked link for DMs / bios / captions.
 * Example: https://swagojr.com/r/annie_ig/reel
 * Web expands this to full UTM query on redirect.
 */
export function buildShortCreatorLink(input: CreatorLinkInput): string {
  const origin = (input.siteOrigin || getSiteOrigin()).replace(/\/$/, "");
  const id = encodeURIComponent(String(input.creatorId || "").toLowerCase().trim());
  const placement = String(input.placement || "story")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "");
  const base = `${origin}/r/${id}`;
  if (!placement || placement === "story") {
    // default placement is story on the redirect — keep URL shortest
    return base;
  }
  return `${base}/${encodeURIComponent(placement)}`;
}

/** Full expanded UTM link (what the short link redirects to). */
export function buildFullUtmCreatorLink(input: CreatorLinkInput): string {
  const origin = (input.siteOrigin || getSiteOrigin()).replace(/\/$/, "");
  const path = input.path?.startsWith("/") ? input.path : "/";
  const params = new URLSearchParams({
    utm_source: input.platform || "instagram",
    utm_medium: "influencer",
    utm_campaign: input.defaultCampaign || "collab",
    utm_content: String(input.creatorId || "").toLowerCase().trim(),
    utm_term: input.placement || "story",
  });
  return `${origin}${path}?${params.toString()}`;
}
