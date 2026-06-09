"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAccess, upsertRolePermission } from "@/lib/permissions";
import { ALL_MENU_KEYS } from "@/lib/menu-registry";

export interface SavePermissoesResult {
  success: boolean;
  error?: string;
}

/**
 * Salva as permissões de menu de um perfil. Apenas administradores podem
 * executar esta ação (verificação no servidor, independente da UI).
 */
export async function savePermissoes(input: {
  roleId: string;
  roleNome: string;
  permitirTudo: boolean;
  menus: string[];
}): Promise<SavePermissoesResult> {
  try {
    const access = await getCurrentAccess();
    if (!access.isAdmin) {
      return {
        success: false,
        error: "Apenas administradores podem alterar permissões.",
      };
    }

    if (!input.roleId) {
      return { success: false, error: "Perfil inválido." };
    }

    // Sanitiza as chaves recebidas contra o registro canônico.
    const menus = (input.menus || []).filter((k) => ALL_MENU_KEYS.includes(k));

    await upsertRolePermission({
      roleId: input.roleId,
      roleNome: input.roleNome,
      permitirTudo: input.permitirTudo,
      menus,
    });

    revalidatePath("/configuracoes");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar permissões:", error);
    return {
      success: false,
      error: "Falha ao salvar. Verifique a conexão com o Directus.",
    };
  }
}
