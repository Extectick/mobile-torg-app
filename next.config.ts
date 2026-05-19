import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    '192.168.0.15', '192.168.1.149', '192.168.30.206', '37.233.82.200'
  ],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
