"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AnnouncementBanner from "./AnnouncementBanner";

interface LayoutUIProps {
  children: React.ReactNode;
  isBlogOnly: boolean;
}

export default function LayoutUI({ children, isBlogOnly }: LayoutUIProps) {
  const pathname = usePathname();

  // Check routes for conditional rendering
  const isLoginRoute = pathname.startsWith("/login");
  const isBlogRoute = pathname.startsWith("/blog");

  // Logic for showing elements
  const showBanner = !isBlogOnly && !isLoginRoute;
  const showNavAndFooter = (!isBlogOnly || isBlogRoute) && !isLoginRoute;

  return (
    <>
      {showBanner && <AnnouncementBanner />}
      {showNavAndFooter && <Navbar />}
      <main className="flex-grow">{children}</main>
      {showNavAndFooter && <Footer />}
    </>
  );
}
