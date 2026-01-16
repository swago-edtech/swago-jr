// apps/web/src/app/kids/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swago - Kids Zone",
  description: "Fun learning games and activities for kids",
};

export default function KidsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}