/**
 * Registro canônico dos itens de menu do sidebar.
 *
 * Cada item possui uma `key` estável usada para controlar permissões de acesso
 * por perfil (role do Directus). Este arquivo é a fonte única de verdade
 * compartilhada entre o Sidebar (renderização/filtragem) e a tela de
 * Configurações → Permissões (administração).
 *
 * Importante: não importa ícones nem dependências de client/server aqui — é um
 * módulo puro para poder ser usado tanto no servidor quanto no cliente.
 */

export type MenuGroup = "main" | "system";

export interface MenuMeta {
  /** Identificador estável persistido na configuração de permissões. */
  key: string;
  /** Rótulo exibido na tela de permissões. */
  label: string;
  /** Rota base usada para casar o pathname atual com este item. */
  href: string;
  /** Grupo visual no sidebar. */
  group: MenuGroup;
  /** Itens sempre acessíveis, não podem ser desabilitados (evita lockout). */
  alwaysOn?: boolean;
}

export const MENU_REGISTRY: MenuMeta[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", group: "main", alwaysOn: true },
  { key: "tramitacoes", label: "Gestão de Demandas", href: "/tramitacoes", group: "main" },
  { key: "eventos", label: "Agenda Institucional", href: "/eventos", group: "main" },
  { key: "marketing", label: "Marketing e Comunicação", href: "/marketing", group: "main" },
  { key: "mulheres", label: "Gestão de Mulheres", href: "/mulheres", group: "main" },
  { key: "escola", label: "Escola da Mulher", href: "/escola", group: "main" },
  { key: "sala-azul", label: "Sala Azul", href: "/sala-azul", group: "main" },
  { key: "relatorios", label: "Relatórios", href: "/relatorios", group: "main" },
  { key: "observatorio", label: "Observatório", href: "/observatorio", group: "main" },
  { key: "app-amar", label: "App Amar", href: "/app-amar", group: "main" },
  { key: "manual", label: "Manual do Usuário", href: "/manual", group: "system" },
  { key: "configuracoes", label: "Configurações", href: "/configuracoes", group: "system" },
  { key: "auditoria", label: "Auditoria", href: "/auditoria", group: "system" },
];

/** Todas as chaves de menu existentes. */
export const ALL_MENU_KEYS: string[] = MENU_REGISTRY.map((m) => m.key);

/** Chaves que nunca podem ser bloqueadas (ex.: Dashboard, página inicial). */
export const ALWAYS_ON_KEYS: string[] = MENU_REGISTRY.filter((m) => m.alwaysOn).map(
  (m) => m.key,
);

/**
 * Resolve a chave de menu correspondente a um pathname, usando o casamento de
 * prefixo mais longo (ex.: "/configuracoes/site" casa "site" antes de
 * "configuracoes"; "/mulheres/beneficiarias/1" casa "mulheres").
 * Retorna `null` quando nenhum item corresponde (rota neutra).
 */
export function resolveMenuKey(pathname: string): string | null {
  let best: MenuMeta | null = null;
  for (const item of MENU_REGISTRY) {
    const matches =
      pathname === item.href || pathname.startsWith(item.href + "/");
    if (matches && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best?.key ?? null;
}

/**
 * Calcula o conjunto de chaves de menu que um perfil pode acessar.
 *
 * @param isAdmin   Perfil administrador (admin_access) — sempre vê tudo.
 * @param config    Linha de configuração do perfil (ou null se inexistente).
 */
export function getAllowedMenuKeys(
  isAdmin: boolean,
  config?: { permitir_tudo?: boolean | null; menus?: unknown } | null,
): string[] {
  // Admin nunca é bloqueado.
  if (isAdmin) return [...ALL_MENU_KEYS];

  // Sem configuração ou "permitir tudo" → acesso total (default seguro).
  if (!config || config.permitir_tudo) return [...ALL_MENU_KEYS];

  const raw = Array.isArray(config.menus) ? (config.menus as unknown[]) : [];
  const selected = raw.filter(
    (k): k is string => typeof k === "string" && ALL_MENU_KEYS.includes(k),
  );

  // Garante os itens sempre acessíveis.
  return Array.from(new Set([...ALWAYS_ON_KEYS, ...selected]));
}
