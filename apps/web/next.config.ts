import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Next.js to transpile our shared packages
  transpilePackages: ['@swago/utils', '@swago/database', '@swago/types'],
  
  // Optional: Fix the workspace root warning
  outputFileTracingRoot: path.join(__dirname, '../..'),
  
  // 🔥 FIXED: Moved out of experimental (Next.js 15 update)
  serverExternalPackages: ['mongoose']
};

export default nextConfig;