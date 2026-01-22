import { createDirectus, rest, staticToken } from "@directus/sdk";

// Usa variáveis públicas se disponíveis no client, ou as de servidor no backend
const directusUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "http://192.168.0.115:8055";

const directusToken = process.env.DIRECTUS_TOKEN || "";

// Fetch customizado para evitar cache agressivo do Next.js
const noCacheFetch = (url: RequestInfo | URL, init?: RequestInit) => {
  return fetch(url, {
    ...init,
    cache: "no-store",
  });
};

export const directus = createDirectus(directusUrl, {
  globals: {
    fetch: noCacheFetch as any,
  },
})
  .with(rest())
  .with(staticToken(directusToken));
