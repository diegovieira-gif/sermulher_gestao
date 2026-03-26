import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Otimização do Next.js 16
  reactCompiler: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  // 👇 CORREÇÃO: Liberação do proxy Traefik para as Server Actions 👇
  experimental: {
    serverActions: {
      allowedOrigins: [
        "fluxo-sermulher.aracaju.se.gov.br",
        "*.aracaju.se.gov.br",
        "localhost:3000",
        "localhost:3002",
        "192.168.0.115:3002"
      ],
    },
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