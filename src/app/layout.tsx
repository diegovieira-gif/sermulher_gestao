import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner"; // Ajuste para o Toaster padrão do Sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SerMulher - Gestão",
  description: "Sistema de Gestão Integrada de Políticas para as Mulheres",
  icons: {
    icon: "/favicon.ico", // Opcional: ícone se tiver
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
