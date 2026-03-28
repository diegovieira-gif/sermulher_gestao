import { redirect } from "next/navigation";
import { createDirectus, rest, staticToken } from "@directus/sdk";

// Usa variáveis públicas se disponíveis no client, ou as de servidor no backend
const directusUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
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

/**
 * Utilitário para envolver chamadas do Directus, interceptando erros 401 de forma segura.
 * Pode ser utilizando em Server Actions para impedir que a app quebre e garantir o relogin.
 */
export async function safeDirectusCall<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error: any) {
    // Preservar o redirect interno do próprio framework (se já estiver em curso)
    if (error?.message === "NEXT_REDIRECT") {
      throw error;
    }

    // Verificar se o formato de erro provido aponta para perda de credenciais/token vencido
    const isUnauthorized =
      error?.response?.status === 401 ||
      error?.status === 401 ||
      error?.message?.includes("Invalid user credentials") ||
      error?.errors?.some?.(
        (e: any) =>
          e?.extensions?.code === "INVALID_CREDENTIALS" ||
          e?.extensions?.code === "TOKEN_EXPIRED"
      );

    if (isUnauthorized) {
      console.warn(
        "⚠️ Chamada interceptada pela safeDirectusCall: Token inválido ou expirado (401). Redirecionando..."
      );
      // Redireciona via API do Next.js de forma segura.
      // O throw originado pelo redirect escalará e executará na UI.
      redirect("/login?error=unauthorized");
    }

    // Ocorreu outro erro de banco ou requisição (500, etc), relança para que seja tratado externamente.
    throw error;
  }
}
