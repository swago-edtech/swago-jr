import "./globals.css";
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext";
import Script from "next/script";
// 1. Import the new Footer component
import Footer from "@/components/Footer";

export const metadata = {
  title: "Swago Junior - Kids Learning Kits",
  description: "Fun and interactive learning kits for kids.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* 2. Modified body for a sticky footer layout */}
      <body className="flex flex-col min-h-screen bg-gray-50">
        <SharedProvider>
          <Navbar />
          {/* 3. Added flex-grow to make the main content fill available space */}
          <main className="flex-grow p-6">{children}</main>
          {/* 4. Added the Footer component */}
          <Footer />
        </SharedProvider>
        
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}