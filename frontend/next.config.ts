import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    allowedDevOrigins: [
      "https://www.enzolobatocoutinho.fr",
      "http://www.enzolobatocoutinho.fr",
    ],
  },
};

export default nextConfig;