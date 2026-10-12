// apps/web/src/app/layout.tsx

import "./globals.css";
import { SharedProvider } from "@/context/SharedContext";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import LayoutUI from "@/components/LayoutUI";
import AttributionCapture from "@/components/AttributionCapture";
import ConsentBanner from "@/components/ConsentBanner";
import AnalyticsScripts from "@/components/AnalyticsScripts";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Swago - Kids Learning Smart Box",
  description: "Fun and interactive learning smart box for kids.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isBlogOnly = process.env.BLOG_ONLY_MODE === "true";

  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-gray-50 font-poppins" suppressHydrationWarning>
        <SharedProvider>
          <Suspense fallback={<div className="flex-grow" />}>
            <AttributionCapture />
            <LayoutUI isBlogOnly={isBlogOnly}>
              {children}
            </LayoutUI>
          </Suspense>
          <ConsentBanner />
        </SharedProvider>

        {/* GA4 + optional Clarity — only after analytics consent */}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
