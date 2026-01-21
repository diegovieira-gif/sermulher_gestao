import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // <--- OBRIGATÓRIO PARA DOCKER
  reactCompiler: true,
  // Permite carregar imagens do seu Directus local
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.0.115",
        port: "8055",
      },
    ],
  },
};

export default nextConfig;
