/**
 * Sessão: nomes de cookie, opções e renovação do access token.
 *
 * Este módulo é compartilhado entre o login (route handler), o proxy
 * (middleware) e o logout (server action), então precisa ser **edge-safe**:
 * nada de `Buffer`, `node:*` ou `server-only`. Só APIs disponíveis nos dois
 * runtimes.
 */

export const ACCESS_COOKIE = "directus_token";
export const REFRESH_COOKIE = "directus_refresh_token";

/**
 * Renova quando faltar menos que isto para o access token expirar.
 *
 * Folga generosa de propósito. O Directus rotaciona o refresh token, então
 * requisições paralelas competem por ele e só uma vence. Renovando cedo, a
 * perdedora ainda tem um access token válido por vários minutos e segue em
 * silêncio (ver `proxy.ts`). Se renovássemos só na iminência da expiração, a
 * perdedora ficaria sem token utilizável e derrubaria a sessão que a vencedora
 * acabou de renovar.
 *
 * Com TTL de ~15 min, isto dispara no máximo uma renovação a cada ~10 min de
 * uso contínuo.
 */
export const REFRESH_THRESHOLD_SECONDS = 300;

/** Validade do cookie de refresh. Menor que o REFRESH_TOKEN_TTL do Directus
 *  (7 dias por padrão) para o cookie nunca sobreviver ao token que carrega. */
export const REFRESH_COOKIE_MAX_AGE = 6 * 24 * 60 * 60; // 6 dias

const BASE_URL = (
  process.env.DIRECTUS_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
  "http://192.168.0.118:8055"
).replace(/\/$/, "");

/**
 * `Secure` precisa acompanhar o protocolo REAL da requisição: navegadores
 * descartam cookies Secure em HTTP (exceto localhost), e a produção hoje é
 * servida em HTTP puro na LAN. Basear em NODE_ENV marcaria Secure indevidamente
 * e a sessão se perderia logo após o login.
 */
export function isHttpsRequest(request: {
  headers: { get(name: string): string | null };
  url: string;
}): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function accessCookieOptions(secure: boolean, maxAge: number) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export function refreshCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: "/",
  };
}

/**
 * Lê o `exp` (epoch em segundos) de um JWT sem verificar a assinatura.
 *
 * Não precisa verificar: o cookie é httpOnly e escrito só pelo nosso login, e
 * quem valida o token de verdade é o Directus a cada chamada. Aqui o `exp` só
 * responde "está na hora de renovar?".
 *
 * Usa `atob` em vez de `Buffer` para funcionar também no runtime edge.
 */
export function getTokenExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null; // token estático, não JWT
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Segundos restantes de validade. `null` se o token não disser. */
export function secondsUntilExpiry(token: string): number | null {
  const exp = getTokenExp(token);
  if (exp === null) return null;
  return exp - Math.floor(Date.now() / 1000);
}

/** O access token ainda serve para fazer chamadas? */
export function isAccessTokenUsable(token: string): boolean {
  const restante = secondsUntilExpiry(token);
  // Sem `exp` (token estático) → assume utilizável; quem decide é o Directus.
  if (restante === null) return true;
  return restante > 0;
}

/** Está na hora de renovar (expirado ou perto disso)? */
export function shouldRefresh(token: string): boolean {
  const restante = secondsUntilExpiry(token);
  if (restante === null) return false; // não-JWT: não há o que renovar
  return restante <= REFRESH_THRESHOLD_SECONDS;
}

export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  /** Validade do access token, em segundos. */
  expiresIn: number;
};

/**
 * Troca o refresh token por um novo par.
 *
 * O Directus **rotaciona** o refresh token: o antigo é invalidado no momento em
 * que este endpoint responde. Ver o tratamento de corrida em `proxy.ts`.
 */
export async function refreshSession(
  refreshToken: string,
): Promise<RefreshResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: { access_token?: string; refresh_token?: string; expires?: number };
    };
    const dados = json?.data;
    if (!dados?.access_token || !dados?.refresh_token) return null;

    // `expires` do Directus vem em MILISSEGUNDOS; o maxAge do cookie é em
    // SEGUNDOS. Sem a conversão o cookie viveria ~1000x mais que o token.
    const expiresIn =
      typeof dados.expires === "number" && dados.expires > 0
        ? Math.floor(dados.expires / 1000)
        : 900;

    return {
      accessToken: dados.access_token,
      refreshToken: dados.refresh_token,
      expiresIn,
    };
  } catch {
    return null;
  }
}

/** Invalida o refresh token no servidor (usado no logout). */
export async function revokeSession(refreshToken: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
      cache: "no-store",
    });
  } catch {
    // Falha ao revogar não pode impedir o logout local.
  }
}
