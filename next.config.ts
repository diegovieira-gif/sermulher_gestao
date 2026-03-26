import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  reactCompiler: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.0.115",
        port: "8055",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;