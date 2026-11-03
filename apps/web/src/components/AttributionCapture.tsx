"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttributionFromUrl } from "@/lib/attribution";
import { hasDecidedConsent, hasMarketingConsent, readConsent } from "@/lib/consent";

/**
 * Persists UTM first/last touch when marketing consent is granted,
 * or before the user has decided (so checkout still gets attribution;
 * GA remains gated separately on analytics consent).
 */
export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const consent = readConsent();
    const allow =
      !hasDecidedConsent() || hasMarketingConsent() || consent?.analytics === true;
    if (!allow) return;

    const search = searchParams?.toString() ? `?${searchParams.toString()}` : window.location.search;
    captureAttributionFromUrl({
      search,
      path: pathname || window.location.pathname,
      referrer: document.referrer,
    });
  }, [pathname, searchParams]);

  return null;
}
