import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  
  // Silence MongoDB optional dependency warnings
  webpack: (config, { isServer }) => {
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
