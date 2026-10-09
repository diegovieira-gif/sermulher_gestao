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
 * NÃO é só UX: as server actions guardadas por `assertAccess`/`assertAdmin`
 * seguem com o token administrativo, então esta camada É a autorização delas.
 * Por isso falha FECHADO: sessão que o Directus não confirma, perfil que não
 * se consegue resolver ou configuração ilegível → só os itens `alwaysOn`.
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

/** Directus travado não pode prender a navegação inteira (o padrão é ~300 s). */
const TIMEOUT_MS = Number(process.env.DIRECTUS_FETCH_TIMEOUT_MS) || 10_000;

async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
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

export interface SessaoValidada {
  userId: string;
  roleId: string | null;
}

/**
 * Quem é a usuária da sessão, CONFIRMADO pelo Directus.
 *
 * O conteúdo do cookie não é prova de nada: o JWT pode ser montado à mão e a
 * assinatura não é verificável aqui (o SECRET fica só no Directus). Antes, o
 * `role` e o `admin_access` eram lidos do payload — um cookie forjado com
 * `"admin_access": true` passava em `assertAdmin` e as actions seguiam com o
 * token administrativo. Agora:
 *
 * 1. `/users/me` com o token da própria sessão — o Directus valida assinatura
 *    e validade; token falso ou expirado → `null`;
 * 2. o perfil vem de `/users/:id` com o token administrativo, porque um perfil
 *    sem policy de leitura não enxerga o próprio `role` no `/users/me`.
 *
 * Memoizado por requisição: layout, página e actions fazem uma consulta só.
 */
export const getSessaoValidada = cache(
  async (): Promise<SessaoValidada | null> => {
    const token = (await cookies()).get("directus_token")?.value;
    if (!token) return null;
    try {
      const res = await fetch(`${BASE_URL}/users/me?fields=id`, {
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const userId = (await res.json())?.data?.id;
      if (typeof userId !== "string" || !userId) return null;
      const user = await adminFetch<{ role?: string | { id?: string } | null }>(
        `/users/${encodeURIComponent(userId)}?fields=role`,
      );
      const role = user?.role;
      const roleId = typeof role === "string" ? role : (role?.id ?? null);
      return { userId, roleId };
    } catch {
      return null;
    }
  },
);

/**
 * Mapa roleId → isAdmin, derivado de directus_access × directus_policies.
 * Em Directus 11, `admin_access` vive na policy, ligada ao role via access.
 * Fallback por nome ("Administrator"/"Admin") caso os endpoints falhem.
 */
async function getRoleAdminMap(
  roles: { id: string; name: string }[],
): Promise<Record<string, boolean>> {
  // Só para quando /access ou /policies falham — e com nome EXATO: "^admin"
  // marcava o perfil "Administrativo" (um setor) como administrador.
  const byName: Record<string, boolean> = {};
  for (const r of roles) {
    byName[r.id] = r.name === "Administrator";
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
    for (const r of roles) map[r.id] = map[r.id] || false;
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
 * - Role resolvido e sem linha de configuração (ou leitura falhou) → só os
 *   `alwaysOn`: liberar um perfil é explícito, em Configurações → Permissões.
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
      temSessao = (cookieStore.get("directus_token")?.value ?? "") !== "";
      if (!temSessao) return semSessao;

      const sessao = await getSessaoValidada();
      const roleId = sessao?.roleId ?? null;
      if (!roleId) return sessaoSemRole;

      // admin_access vem das policies do perfil (Directus 11), lidas com o
      // token administrativo — nunca do conteúdo do cookie.
      const roles = await listRoles();
      const role = roles.find((r) => r.id === roleId) || null;
      if (!role) return sessaoSemRole;
      const isAdmin = role.isAdmin;

      const config = isAdmin ? null : await getPermissionConfigForRole(roleId);
      return {
        roleId,
        roleName: role.name,
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

/** Exige uma sessão que o Directus confirme (não basta o cookie existir). */
export async function assertAuthenticated(): Promise<void> {
  if (!(await getSessaoValidada())) {
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
