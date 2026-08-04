import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ALL_MENU_KEYS,
  ALWAYS_ON_KEYS,
  getAllowedMenuKeys,
} from "@/lib/menu-registry";

/**
 * Camada de permissões de menu (nível de aplicação).
 *
 * Toda leitura/gravação privilegiada usa o token administrativo estático
 * (`DIRECTUS_TOKEN`), de modo que perfis restritos não precisam de nenhuma
 * configuração de permissão no próprio Directus para que o menu seja filtrado.
 *
 * Filosofia "fail-open": se qualquer consulta falhar (instância indisponível,
 * etc.), liberamos o menu completo. O bloqueio é de UX/navegação — os dados em
 * si permanecem protegidos pelas permissões do Directus.
 */

const BASE_URL =
  process.env.DIRECTUS_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
  "http://192.168.0.118";

const ADMIN_TOKEN = process.env.DIRECTUS_TOKEN || "";
const PERM_COLLECTION = "config_permissoes_menu";

export interface RolePermission {
  id?: number;
  role: string;
  role_nome?: string | null;
  permitir_tudo?: boolean | null;
  menus?: string[] | null;
}

export interface RoleInfo {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface CurrentAccess {
  roleId: string | null;
  roleName: string | null;
  isAdmin: boolean;
  allowedKeys: string[];
}

async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Directus ${res.status} em ${path}`);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json?.data ?? json) as T;
}

interface SessionClaims {
  roleId: string | null;
  /** `admin_access` do token — presente apenas em JWTs do Directus. */
  isAdmin: boolean | null;
}

/**
 * Extrai `role` e `admin_access` do próprio token de sessão.
 *
 * O access token emitido pelo login do Directus é um JWT cujo payload já traz
 * `role`, `admin_access` e `app_access`. Ler dali tem duas vantagens sobre o
 * `GET /users/me?fields=role`:
 *
 * 1. Não depende de permissão de leitura: um perfil sem policy vinculada
 *    (ex.: perfil recém-criado sem a "App Padrão") não expõe o campo `role`
 *    no /users/me — o role vinha `null`, o fallback fail-open disparava e o
 *    usuário via o MENU COMPLETO justamente por ter menos permissão.
 * 2. `admin_access` vem do próprio Directus, sem a heurística de nome
 *    ("Administrator") nem as consultas a /access e /policies.
 *
 * A assinatura NÃO é verificada aqui — nem precisa: o cookie é httpOnly e
 * escrito apenas pelo nosso login, o gate de menu é UX, e toda leitura/escrita
 * de dados continua passando pelo Directus, que valida o token de verdade.
 */
function decodeSessionClaims(token: string): SessionClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null; // não é JWT (ex.: token estático)
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { role?: unknown; admin_access?: unknown };
    const roleId = typeof payload.role === "string" ? payload.role : null;
    const isAdmin =
      typeof payload.admin_access === "boolean" ? payload.admin_access : null;
    return { roleId, isAdmin };
  } catch {
    return null;
  }
}

/** Lê o role (uuid) do usuário logado usando o cookie de sessão. */
async function getCurrentUserRoleId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("directus_token")?.value;
    if (!token) return null;

    // Caminho principal: o role está no próprio JWT.
    const claims = decodeSessionClaims(token);
    if (claims?.roleId) return claims.roleId;

    // Fallback (token não-JWT): consulta o Directus com o token do usuário.
    const res = await fetch(`${BASE_URL}/users/me?fields=id,role`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const role = json?.data?.role;
    return typeof role === "string" ? role : (role?.id ?? null);
  } catch {
    return null;
  }
}

/**
 * Mapa roleId → isAdmin, derivado de directus_access × directus_policies.
 * Em Directus 11, `admin_access` vive na policy, ligada ao role via access.
 * Fallback por nome ("Administrator"/"Admin") caso os endpoints falhem.
 */
async function getRoleAdminMap(
  roles: { id: string; name: string }[],
): Promise<Record<string, boolean>> {
  const byName: Record<string, boolean> = {};
  for (const r of roles) {
    byName[r.id] = /^admin/i.test(r.name) || r.name === "Administrator";
  }
  try {
    const [access, policies] = await Promise.all([
      adminFetch<{ role: string | null; policy: string | null }[]>(
        "/access?fields=role,policy&limit=-1",
      ),
      adminFetch<{ id: string; admin_access: boolean }[]>(
        "/policies?fields=id,admin_access&limit=-1",
      ),
    ]);
    const adminPolicies = new Set(
      policies.filter((p) => p.admin_access).map((p) => p.id),
    );
    const map: Record<string, boolean> = {};
    for (const a of access) {
      if (a.role && a.policy && adminPolicies.has(a.policy)) {
        map[a.role] = true;
      }
    }
    // Combina com fallback por nome (sem rebaixar quem já é admin).
    for (const r of roles) {
      map[r.id] = map[r.id] || byName[r.id] || false;
    }
    return map;
  } catch {
    return byName;
  }
}

/** Lista todos os perfis com flag de admin. */
export async function listRoles(): Promise<RoleInfo[]> {
  try {
    const roles = await adminFetch<{ id: string; name: string }[]>(
      "/roles?fields=id,name&sort=name&limit=-1",
    );
    const adminMap = await getRoleAdminMap(roles);
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      isAdmin: adminMap[r.id] ?? false,
    }));
  } catch {
    return [];
  }
}

/** Lê todas as linhas de configuração de permissão. */
export async function getPermissionConfigs(): Promise<RolePermission[]> {
  try {
    return await adminFetch<RolePermission[]>(
      `/items/${PERM_COLLECTION}?fields=id,role,role_nome,permitir_tudo,menus&limit=-1`,
    );
  } catch {
    return [];
  }
}

/** Configuração de um perfil específico (ou null). */
export async function getPermissionConfigForRole(
  roleId: string,
): Promise<RolePermission | null> {
  try {
    const rows = await adminFetch<RolePermission[]>(
      `/items/${PERM_COLLECTION}?filter[role][_eq]=${encodeURIComponent(
        roleId,
      )}&limit=1`,
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Acesso efetivo do usuário logado: role, se é admin e as chaves de menu
 * permitidas.
 *
 * Política de falha:
 * - Sem cookie de sessão → menu completo (o proxy já barrou a navegação; este
 *   caso só existe em render fora de sessão, ex.: build).
 * - COM sessão mas role não resolvido → fail-closed: apenas os itens
 *   `alwaysOn`. Antes era fail-open (menu completo), e um perfil sem policy
 *   no Directus — que não conseguia nem ler o próprio `role` — acabava vendo
 *   o menu inteiro justamente por ter MENOS permissão.
 * - Role resolvido e sem linha de configuração → menu completo (default
 *   documentado: perfil ainda não configurado não é perfil restrito).
 *
 * Memoizado por requisição (React cache) — layout, páginas e actions dentro da
 * mesma requisição compartilham a mesma consulta.
 */
export const getCurrentAccess = cache(
  async (): Promise<CurrentAccess> => {
    const semSessao: CurrentAccess = {
      roleId: null,
      roleName: null,
      isAdmin: false,
      allowedKeys: [...ALL_MENU_KEYS],
    };
    // Fail-closed: há sessão, mas não dá para saber quem é.
    const sessaoSemRole: CurrentAccess = {
      roleId: null,
      roleName: null,
      isAdmin: false,
      allowedKeys: [...ALWAYS_ON_KEYS],
    };

    let temSessao = false;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("directus_token")?.value ?? "";
      temSessao = token !== "";

      if (!temSessao) return semSessao;

      // `admin_access` direto do JWT — dispensa heurística de nome de perfil
      // e as consultas a /access e /policies para o usuário corrente.
      const claims = decodeSessionClaims(token);

      const roleId = claims?.roleId ?? (await getCurrentUserRoleId());
      if (!roleId) return sessaoSemRole;

      let isAdmin = claims?.isAdmin ?? null;
      let roleName: string | null = null;

      // Nome do perfil (e admin, se o token não trouxe) via cadastro de roles.
      const roles = await listRoles();
      const role = roles.find((r) => r.id === roleId) || null;
      roleName = role?.name ?? null;
      if (isAdmin === null) isAdmin = role?.isAdmin ?? false;

      const config = isAdmin ? null : await getPermissionConfigForRole(roleId);
      return {
        roleId,
        roleName,
        isAdmin,
        allowedKeys: getAllowedMenuKeys(isAdmin, config),
      };
    } catch {
      return temSessao ? sessaoSemRole : semSessao;
    }
  },
);

/**
 * Guarda de autorização de servidor (fail-closed) para Server Actions que
 * operam com o cliente administrativo (`getDirectusAdmin()`).
 *
 * - Sem cookie de sessão → redireciona para o login.
 * - Sessão presente mas o role não pôde ser resolvido → nega (fail-closed).
 * - Perfil sem a chave de menu e não-admin → lança erro de acesso negado.
 *
 * Retorna o acesso corrente para uso posterior (ex.: `access.isAdmin`).
 */
export async function assertAccess(menuKey: string): Promise<CurrentAccess> {
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;
  if (!token) {
    redirect("/login?error=unauthorized");
  }

  const access = await getCurrentAccess();

  // Fail-closed: cookie presente mas não conseguimos resolver o role
  // (token expirado/inválido ou Directus indisponível) → nega a operação.
  if (!access.roleId) {
    redirect("/login?error=unauthorized");
  }

  if (access.isAdmin || access.allowedKeys.includes(menuKey)) {
    return access;
  }

  throw new Error(
    `Acesso negado: seu perfil não tem permissão para o módulo "${menuKey}".`,
  );
}

/** Exige perfil administrador (admin_access) — fail-closed. */
export async function assertAdmin(): Promise<CurrentAccess> {
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;
  if (!token) {
    redirect("/login?error=unauthorized");
  }

  const access = await getCurrentAccess();
  if (!access.roleId || !access.isAdmin) {
    throw new Error("Acesso negado: apenas administradores.");
  }
  return access;
}

/** Exige apenas uma sessão autenticada (cookie de sessão presente). */
export async function assertAuthenticated(): Promise<void> {
  const cookieStore = await cookies();
  if (!cookieStore.get("directus_token")?.value) {
    redirect("/login?error=unauthorized");
  }
}

/** Cria ou atualiza (upsert) a configuração de um perfil. */
export async function upsertRolePermission(input: {
  roleId: string;
  roleNome: string;
  permitirTudo: boolean;
  menus: string[];
}): Promise<void> {
  const existing = await getPermissionConfigForRole(input.roleId);
  const body = JSON.stringify({
    role: input.roleId,
    role_nome: input.roleNome,
    permitir_tudo: input.permitirTudo,
    menus: input.menus,
  });
  if (existing?.id) {
    await adminFetch(`/items/${PERM_COLLECTION}/${existing.id}`, {
      method: "PATCH",
      body,
    });
  } else {
    await adminFetch(`/items/${PERM_COLLECTION}`, {
      method: "POST",
      body,
    });
  }
}
