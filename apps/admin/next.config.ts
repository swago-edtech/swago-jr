import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Optimize memory usage on constrained build machines like AWS t3a.medium (4GB RAM)
  experimental: {
    memoryBasedWorkersCount: true,
    webpackMemoryOptimizations: true,
    optimizePackageImports: ["lucide-react", "react-icons", "recharts", "date-fns"],
  },

  // Standalone output for Docker — bundles only the files needed at runtime
  output: 'standalone',

  // Required for monorepo: trace dependencies from the workspace root
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Tell Next.js to transpile our shared packages
  transpilePackages: ['@swago/utils', '@swago/database', '@swago/types'],

  serverExternalPackages: ['mongoose', 'googleapis'],

  turbopack: {},
  images: {
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
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },

  // Silence MongoDB optional dependency warnings + cap parallelism for low-RAM builds
  webpack: (config, { isServer }) => {
    config.parallelism = 1;
    if (isServer) {
      config.externals.push({
        'aws4': 'commonjs aws4',
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
        'kerberos': 'commonjs kerberos',
        '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
        'snappy': 'commonjs snappy',
        'socks': 'commonjs socks',
        '@aws-sdk/credential-providers': 'commonjs @aws-sdk/credential-providers',
        'gcp-metadata': 'commonjs gcp-metadata',
      });
    }
    return config;
  },
};

export default nextConfig;
