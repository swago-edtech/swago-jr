import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimize memory usage on constrained build machines like AWS t3a.medium (4GB RAM)
  experimental: {
    memoryBasedWorkersCount: true,
    webpackMemoryOptimizations: true,
    optimizePackageImports: ["lucide-react", "react-icons"],
  },

  // Standalone output for Docker — bundles only the files needed at runtime
  output: 'standalone',

  // Tell Next.js to transpile our shared packages
  transpilePackages: ['@swago/utils', '@swago/database', '@swago/types'],

  // Required for monorepo: trace dependencies from the workspace root
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Server-side packages
  serverExternalPackages: ['mongoose', 'pdfkit', 'googleapis'],

  // Required on Next 16 when a custom webpack() is present (Turbopack is default)
  turbopack: {},

  // Cap webpack parallelism to reduce peak RAM during `next build`
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },

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
