import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createDirectus, rest, staticToken } from "@directus/sdk";

type DirectusErrorShape = {
  message?: string;
  response?: {
    status?: number;
  };
  status?: number;
  errors?: Array<{
    extensions?: {
      code?: string;
    };
  }>;
};

// Usa variáveis públicas se disponíveis no client, ou as de servidor no backend
const directusUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
  process.env.DIRECTUS_API_URL ||
  "http://192.168.0.118";

const directusToken = process.env.DIRECTUS_TOKEN || "";
const directusTimeoutMs = Number(
  process.env.NEXT_PUBLIC_DIRECTUS_FETCH_TIMEOUT_MS ||
    process.env.DIRECTUS_FETCH_TIMEOUT_MS ||
    20000,
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
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  let token = directusToken;
  try {
    const cookieStore = await cookies();
    const userToken = cookieStore.get("directus_token")?.value;
    if (userToken) {
      token = userToken;
    }
  } catch {
    // Pode falhar caso chamado fora de contexto de requisição (ex: build estático)
  }

  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await fetch(url, {
      ...init,
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const directus = createDirectus(directusUrl, {
  globals: {
    fetch: noCacheFetch as typeof fetch,
  },
}).with(rest());

type GetDirectusClientOptions = {
  requireAuth?: boolean;
};

export async function getDirectusClient(
  options: GetDirectusClientOptions = {},
) {
  const { requireAuth = false } = options;
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;

  if (!token) {
    if (requireAuth) {
      throw new Error(
        "Authentication required: directus_token cookie not found",
      );
    }

    return directus;
  }

  return createDirectus(directusUrl, {
    globals: {
      fetch: noCacheFetch as typeof fetch,
    },
  })
    .with(staticToken(token))
    .with(rest());
}

function isUnauthorizedError(error: unknown): boolean {
  const directusError = error as DirectusErrorShape;

  return (
    directusError?.response?.status === 401 ||
    directusError?.status === 401 ||
    directusError?.message?.includes("Authentication required") === true ||
    directusError?.message?.includes("Invalid user credentials") === true ||
    directusError?.errors?.some(
      (entry) =>
        entry?.extensions?.code === "INVALID_CREDENTIALS" ||
        entry?.extensions?.code === "TOKEN_EXPIRED",
    ) === true
  );
}

/**
 * Utilitário para envolver chamadas do Directus, interceptando erros 401 de forma segura.
 * Pode ser utilizando em Server Actions para impedir que a app quebre e garantir o relogin.
 */
export async function safeDirectusCall<T>(
  request: () => Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch (error: unknown) {
    // Preservar o redirect interno do próprio framework (se já estiver em curso)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    if (isUnauthorizedError(error)) {
      console.warn(
        "⚠️ Chamada interceptada pela safeDirectusCall: Token inválido ou expirado (401). Redirecionando...",
      );
      // Redireciona via API do Next.js de forma segura.
      // O throw originado pelo redirect escalará e executará na UI.
      redirect("/login?error=unauthorized");
    }

    // Ocorreu outro erro de banco ou requisição (500, etc), relança para que seja tratado externamente.
    throw error;
  }
}
