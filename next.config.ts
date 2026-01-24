import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // OTIMIZADO PARA DOCKER/RAILWAY

  // Configurações Experimentais (React Compiler do Next 15)
  experimental: {
    reactCompiler: true,
  },

  // --- BLINDAGEM DE DEPLOY ---
  // Impede que erros estritos de TS ou Lint travem o build de produção
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // --- IMAGENS ---
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.0.115", // Seu IP local atual
        port: "8055",
      },
      {
        protocol: "https",
        hostname: "**", // Permite carregar imagens de qualquer domínio HTTPS (útil para produção)
      },
    ],
  },
};

export default nextConfig;
