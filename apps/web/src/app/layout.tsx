// apps/web/src/app/layout.tsx

import "./globals.css";
import { headers } from "next/headers";
import { GoogleAnalytics } from '@next/third-parties/google';
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CartSidebar from "@/components/CartSidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";


export const metadata = {
  title: "Swago - Kids Learning Kits",
  description: "Fun and interactive learning kits for kids.",
};


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get pathname from headers to check if we're on kids section
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  
  // Check if current route is kids section
  const isKidsRoute = pathname.startsWith("/kids");


  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-50">
        <SharedProvider>
          {/* Show announcement banner on all pages except /kids/* */}
          {!isKidsRoute && <AnnouncementBanner />}
          
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CartSidebar />
        </SharedProvider>

        {/* Google Analytics Component */}
        {/* Make sure to add NEXT_PUBLIC_GA_MEASUREMENT_ID to your .env.local file */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
      </body>
    </html>
  );
}
