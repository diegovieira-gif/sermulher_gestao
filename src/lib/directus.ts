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

  // Política de credenciais:
  // - Em contexto de REQUISIÇÃO, usa exclusivamente o token do usuário
  //   (cookie `directus_token`). Se o cookie estiver ausente ou vazio, a
  //   chamada segue SEM Authorization (papel público do Directus). Nunca
  //   escalar para o token admin aqui — o proxy só verifica a PRESENÇA do
  //   cookie, então um cookie vazio/forjado não pode ganhar privilégio.
  // - Fora de contexto de requisição (build estático), `cookies()` lança e
  //   caímos no token estático do servidor, como antes.
  let token = "";
  try {
    const cookieStore = await cookies();
    token = cookieStore.get("directus_token")?.value ?? "";
  } catch {
    // Fora de contexto de requisição (ex: build estático) → token do servidor.
    token = directusToken;
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

/**
 * Cliente Directus que SEMPRE usa o token administrativo estático
 * (`DIRECTUS_TOKEN`), ignorando o cookie do usuário logado.
 *
 * Usado para funcionalidades de nível de aplicação que precisam ler/gravar
 * dados privilegiados (ex.: configuração de permissões de menu), de forma
 * independente das permissões do perfil do usuário final no Directus.
 */
export function getDirectusAdmin() {
  if (!directusToken) {
    throw new Error(
      "DIRECTUS_TOKEN não configurado: cliente administrativo indisponível.",
    );
  }

  return createDirectus(directusUrl, {
    globals: {
      // Fetch simples com timeout, sem sobrescrever o Authorization pelo cookie.
      fetch: (async (url: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          directusTimeoutMs,
        );
        try {
          return await fetch(url, {
            ...init,
            cache: "no-store",
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }
      }) as typeof fetch,
    },
  })
    .with(staticToken(directusToken))
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
