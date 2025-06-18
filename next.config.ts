import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cssChunking: false,
  },
};

export default nextConfig;
