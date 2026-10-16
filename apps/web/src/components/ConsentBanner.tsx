"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_CONSENT,
  hasDecidedConsent,
  readConsent,
  writeConsent,
  type ConsentPreferences,
} from "@/lib/consent";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    if (!hasDecidedConsent()) {
      setVisible(true);
      return;
    }
    const c = readConsent();
    if (c) {
      setAnalytics(c.analytics);
      setMarketing(c.marketing);
    }
  }, []);

  const apply = (prefs: { analytics: boolean; marketing: boolean }) => {
    writeConsent(prefs);
    setVisible(false);
    // Reload tags cleanly after choice
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">We value your privacy</h2>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              We use cookies for essential site features, analytics (to improve the shop), and marketing
              attribution (to measure campaigns). You can accept all, reject non-essential, or choose.
              Order processing never depends on analytics cookies.
            </p>
          </div>

          {showDetails && (
            <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm">
              <label className="flex items-start gap-3 cursor-not-allowed opacity-80">
                <input type="checkbox" checked disabled className="mt-1" />
                <span>
                  <span className="font-semibold text-slate-900">Necessary</span>
                  <span className="block text-slate-500">Required for login, cart, and checkout.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 accent-[hsl(var(--swago-purple))]"
                />
                <span>
                  <span className="font-semibold text-slate-900">Analytics</span>
                  <span className="block text-slate-500">
                    Google Analytics / Clarity-style measurement of pages and checkout funnel (no purchase PII).
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 accent-[hsl(var(--swago-purple))]"
                />
                <span>
                  <span className="font-semibold text-slate-900">Marketing</span>
                  <span className="block text-slate-500">
                    Store campaign / influencer UTMs so we can attribute orders to channels.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              {showDetails ? "Hide options" : "Customize"}
            </button>
            <button
              type="button"
              onClick={() => apply({ analytics: false, marketing: false })}
              className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Reject non-essential
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={() => apply({ analytics, marketing })}
                className="px-4 py-2.5 text-sm font-bold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Save choices
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  apply({
                    analytics: DEFAULT_CONSENT.analytics || true,
                    marketing: true,
                  })
                }
                className="px-4 py-2.5 text-sm font-bold rounded-lg bg-[hsl(var(--swago-purple))] text-white hover:opacity-95 shadow-md"
              >
                Accept all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// silence unused type export path for TS if needed
export type { ConsentPreferences };
