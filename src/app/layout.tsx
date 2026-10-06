import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SCRIPT_ANTI_FLASH } from "@/lib/tema";
import { ToasterTematico } from "@/components/layout/ToasterTematico";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SERMULHER - Gestão",
  description: "Sistema de Gestão Integrada de Políticas para as Mulheres",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/*
          Roda ANTES de qualquer pintura: liga a classe `.dark` no <html>
          conforme a escolha guardada. `useEffect` chegaria tarde — a página
          nasceria clara e escureceria depois da hidratação.

          O conteúdo é GERADO de `lib/tema.ts`, a mesma regra que o alternador
          usa; o `suppressHydrationWarning` acima existe por causa dessa classe.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ANTI_FLASH }} />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        {children}
        <ToasterTematico />
      </body>
    </html>
  );
}
