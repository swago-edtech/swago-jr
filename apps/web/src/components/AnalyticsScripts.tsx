"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { GoogleAnalytics } from "@next/third-parties/google";
import { hasAnalyticsConsent, readConsent } from "@/lib/consent";

/**
 * Loads GA4 (and optional Clarity) only after analytics consent.
 * Before consent decision, nothing loads — banner handles choice.
 */
export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "";

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent());
    sync();
    const onConsent = () => sync();
    window.addEventListener("swago:consent", onConsent as EventListener);
    return () => window.removeEventListener("swago:consent", onConsent as EventListener);
  }, []);

  // If user already consented on a previous visit, enable immediately after mount
  useEffect(() => {
    if (readConsent()?.analytics) setEnabled(true);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {clarityId ? (
        <Script id="microsoft-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", ${JSON.stringify(clarityId)});
        `}</Script>
      ) : null}
    </>
  );
}
