import "server-only";
import { getCurrentAccess } from "@/lib/permissions";

/**
 * Camada de permissões de TIPOS DE DEMANDA por perfil (nível de aplicação).
 *
 * Mesma filosofia de `permissions.ts` (menus): leitura/gravação privilegiada via
 * token administrativo estático; fail-open (em caso de erro, libera tudo). O
 * vínculo é por perfil (role do Directus) → lista de nomes de tipos de demanda.
 */

const BASE_URL =
  process.env.DIRECTUS_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  process.env.DIRECTUS_URL ||
  "http://192.168.0.118";

const ADMIN_TOKEN = process.env.DIRECTUS_TOKEN || "";
const COLLECTION = "config_permissoes_demanda";

export interface DemandPermission {
  id?: number;
  role: string;
  role_nome?: string | null;
  permitir_tudo?: boolean | null;
  tipos?: string[] | null;
}

export interface DemandAccess {
  isAdmin: boolean;
  /** Nomes de tipos permitidos; `null` = todos (sem restrição). */
  allowedTipos: string[] | null;
}

async function adminFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Directus ${res.status} em ${path}`);
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return (json?.data ?? json) as T;
}

/** Todas as configurações de demanda (uma por perfil). */
export async function getDemandPermissionConfigs(): Promise<DemandPermission[]> {
  try {
    return await adminFetch<DemandPermission[]>(
      `/items/${COLLECTION}?fields=id,role,role_nome,permitir_tudo,tipos&limit=-1`,
    );
  } catch {
    return [];
  }
}

export async function getDemandPermissionConfigForRole(
  roleId: string,
): Promise<DemandPermission | null> {
  try {
    const rows = await adminFetch<DemandPermission[]>(
      `/items/${COLLECTION}?filter[role][_eq]=${encodeURIComponent(roleId)}&limit=1`,
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Tipos de demanda acessíveis ao usuário logado.
 * Admin ou ausência de configuração → todos (`null`). Fail-open em erro.
 */
export async function getCurrentDemandAccess(): Promise<DemandAccess> {
  try {
    const access = await getCurrentAccess();
    if (access.isAdmin || !access.roleId) {
      return { isAdmin: access.isAdmin, allowedTipos: null };
    }
    const cfg = await getDemandPermissionConfigForRole(access.roleId);
    if (!cfg || cfg.permitir_tudo) {
      return { isAdmin: false, allowedTipos: null };
    }
    const tipos = Array.isArray(cfg.tipos)
      ? cfg.tipos.filter((t): t is string => typeof t === "string")
      : [];
    return { isAdmin: false, allowedTipos: tipos };
  } catch {
    return { isAdmin: false, allowedTipos: null };
  }
}

/** Cria/atualiza (upsert) a configuração de um perfil. */
export async function upsertRoleDemandPermission(input: {
  roleId: string;
  roleNome: string;
  permitirTudo: boolean;
  tipos: string[];
}): Promise<void> {
  const existing = await getDemandPermissionConfigForRole(input.roleId);
  const body = JSON.stringify({
    role: input.roleId,
    role_nome: input.roleNome,
    permitir_tudo: input.permitirTudo,
    tipos: input.tipos,
  });
  if (existing?.id) {
    await adminFetch(`/items/${COLLECTION}/${existing.id}`, { method: "PATCH", body });
  } else {
    await adminFetch(`/items/${COLLECTION}`, { method: "POST", body });
  }
}
