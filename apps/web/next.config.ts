import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Next.js to transpile our shared packages
  transpilePackages: ['@swago/utils', '@swago/database', '@swago/types'],

  // ✅ Enable standalone output for deployment
  output: 'standalone',

  // Optional: Fix the workspace root warning
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Server-side packages
  serverExternalPackages: ['mongoose'],

  // ✅ Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
