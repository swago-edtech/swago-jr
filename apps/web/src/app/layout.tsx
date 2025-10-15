import "./globals.css";
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext";
// import Script from "next/script"; // 🔥 REMOVED: Not needed here anymore
import Footer from "@/components/Footer";

export const metadata = {
  title: "Swago Junior - Kids Learning Kits",
  description: "Fun and interactive learning kits for kids.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-gray-50">
        <SharedProvider>
          <Navbar />
          <main className="flex-grow p-6">{children}</main>
          <Footer />
        </SharedProvider>
        
        {/* 🔥 REMOVED: Razorpay script (moved to checkout page only) */}
      </body>
    </html>
  );
}