// apps/web/src/app/layout.tsx

import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';
import { SharedProvider } from "@/context/SharedContext";
import { CountryProvider } from "@/context/CountryContext";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});


import { Suspense } from "react";
import LayoutUI from "@/components/LayoutUI";

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
          <CountryProvider>
            <Suspense fallback={<div className="flex-grow" />}>
              <LayoutUI isBlogOnly={isBlogOnly}>
                {children}
              </LayoutUI>
            </Suspense>
          </CountryProvider>
        </SharedProvider>

        {/* Google Analytics Component */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
      </body>
    </html>
  );
}
