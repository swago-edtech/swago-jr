import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Next.js to transpile our shared packages
  transpilePackages: ['@swago/utils', '@swago/database', '@swago/types'],

  // Required for monorepo: trace dependencies from the workspace root
  outputFileTracingRoot: path.join(__dirname, '../..'),


  // ✅ Image configuration for external domains
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    minimumCacheTTL: 0,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  devIndicators: {
    position: 'bottom-right',
  },
};

export default nextConfig;
