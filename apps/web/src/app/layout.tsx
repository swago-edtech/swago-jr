// apps/web/src/app/layout.tsx

import "./globals.css";
import { headers } from "next/headers";
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext";
import Footer from "@/components/Footer";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Poppins } from "next/font/google";

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
  // Get pathname from headers to check if we're on kids section
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Check if current route is kids section
  const isKidsRoute = pathname.startsWith("/kids");
  const isBlogOnly = process.env.BLOG_ONLY_MODE === "true";
  const isLoginRoute = pathname.startsWith("/login");

  return (
    <html lang="en" className={poppins.variable}>
      <body className="flex flex-col min-h-screen bg-gray-50 font-poppins">
        <SharedProvider>
          {/* Show announcement banner on all pages except /kids/* and blog-only mode */}
          {!isKidsRoute && !isBlogOnly && !isLoginRoute && <AnnouncementBanner />}

          {(!isBlogOnly || pathname.startsWith("/blog")) && !isLoginRoute && <Navbar />}
          <main className="flex-grow">{children}</main>
          {(!isBlogOnly || pathname.startsWith("/blog")) && !isLoginRoute && <Footer />}
        </SharedProvider>

        {/* Google Analytics Component */}
        {/* Make sure to add NEXT_PUBLIC_GA_MEASUREMENT_ID to your .env.local file */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
      </body>
    </html>
  );
}
