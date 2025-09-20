import "./globals.css";
import Navbar from "@/components/Navbar";
import { SharedProvider } from "@/context/SharedContext"; // Updated import

export const metadata = {
  title: "Swago Junior - Kids Learning Kits",
  description: "Fun and interactive learning kits for kids.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <SharedProvider> {/* Updated Provider */}
          <Navbar />
          <main className="p-6">{children}</main>
        </SharedProvider>
      </body>
    </html>
  );
}