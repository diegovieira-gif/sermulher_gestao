import type { Config } from "tailwindcss";

/*
  Tailwind v4 é CSS-first: a paleta e o raio vivem em src/app/globals.css
  (@theme inline + tokens em :root). Aqui ficam apenas os globs de conteúdo.

  O modo escuro também é decidido lá (`@custom-variant dark`), não aqui —
  um `darkMode` neste arquivo não teria efeito nenhum.
*/
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [],
};

export default config;
