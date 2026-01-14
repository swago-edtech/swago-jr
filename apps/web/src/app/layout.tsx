import "./globals.css";
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CartSidebar from "@/components/CartSidebar"; // ✅ NEW IMPORT

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
          <WhatsAppButton />
          <CartSidebar /> {/* ✅ NEW: Cart sidebar available globally */}
        </SharedProvider>
      </body>
    </html>
  );
}
