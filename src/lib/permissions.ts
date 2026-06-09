import "server-only";
import { cookies } from "next/headers";
import {
  ALL_MENU_KEYS,
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

/** Lê o role (uuid) do usuário logado usando o cookie de sessão. */
async function getCurrentUserRoleId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("directus_token")?.value;
    if (!token) return null;
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
 * permitidas. Fail-open: em caso de erro, libera o menu completo.
 */
export async function getCurrentAccess(): Promise<CurrentAccess> {
  const fallback: CurrentAccess = {
    roleId: null,
    roleName: null,
    isAdmin: false,
    allowedKeys: [...ALL_MENU_KEYS],
  };
  try {
    const roleId = await getCurrentUserRoleId();
    if (!roleId) return fallback;

    const roles = await listRoles();
    const role = roles.find((r) => r.id === roleId) || null;
    const isAdmin = role?.isAdmin ?? false;

    const config = isAdmin ? null : await getPermissionConfigForRole(roleId);
    return {
      roleId,
      roleName: role?.name ?? null,
      isAdmin,
      allowedKeys: getAllowedMenuKeys(isAdmin, config),
    };
  } catch {
    return fallback;
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
