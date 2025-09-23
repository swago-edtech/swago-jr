import "./globals.css";
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext";
import Script from "next/script"; // Import the Next.js Script component

export const metadata = {
  title: "Swago Junior - Kids Learning Kits",
  description: "Fun and interactive learning kits for kids.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <SharedProvider>
          <Navbar />
          <main className="p-6">{children}</main>
        </SharedProvider>
        
        {/* Add the Razorpay checkout script here */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}