/**
 * Browser-safe sales channel helpers.
 * Keep this file free of @swago/database / Node-only imports —
 * client components (e.g. ChannelFilterTabs) must import from here.
 */

export type SalesChannel = "website" | "amazon" | "flipkart" | "all";

export function parseSalesChannel(value: string | null | undefined): SalesChannel {
  if (value === "website" || value === "amazon" || value === "flipkart" || value === "all") {
    return value;
  }
  return "all";
}
