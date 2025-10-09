import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Added headers for proper cookie handling in production
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { 
            key: "Access-Control-Allow-Origin", 
            value: process.env.NODE_ENV === "production" 
              ? (process.env.NEXT_PUBLIC_SITE_URL || "*") 
              : "http://localhost:3000" 
          },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;