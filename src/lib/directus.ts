import { createDirectus, rest, staticToken } from "@directus/sdk";

// Usa variáveis públicas se disponíveis no client, ou as de servidor no backend
const directusUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "http://192.168.0.115:8055";

const directusToken = process.env.DIRECTUS_TOKEN || "";
const directusTimeoutMs = Number(
  process.env.NEXT_PUBLIC_DIRECTUS_FETCH_TIMEOUT_MS ||
    process.env.DIRECTUS_FETCH_TIMEOUT_MS ||
    20000
);

// Fetch customizado para evitar cache agressivo do Next.js
const noCacheFetch = async (url: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), directusTimeoutMs);
  const signal = init?.signal;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

// Temporary log to verify Directus URL configuration.
console.log(
  "[directus] env DIRECTUS_URL:",
  process.env.DIRECTUS_URL,
  "resolved:",
  directusUrl
);

export const directus = createDirectus(directusUrl, {
  globals: {
    fetch: noCacheFetch as any,
  },
})
  .with(rest())
  .with(staticToken(directusToken));
