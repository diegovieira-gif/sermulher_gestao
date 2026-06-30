"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAccess } from "@/lib/permissions";
import { upsertRoleDemandPermission } from "@/lib/demanda-permissions";

export interface SaveDemandResult {
  success: boolean;
  error?: string;
}

/**
 * Salva os tipos de demanda permitidos para um perfil. Apenas administradores.
 */
export async function saveDemandPermissoes(input: {
  roleId: string;
  roleNome: string;
  permitirTudo: boolean;
  tipos: string[];
}): Promise<SaveDemandResult> {
  try {
    const access = await getCurrentAccess();
    if (!access.isAdmin) {
      return { success: false, error: "Apenas administradores podem alterar permissões." };
    }
    if (!input.roleId) {
      return { success: false, error: "Perfil inválido." };
    }

    await upsertRoleDemandPermission({
      roleId: input.roleId,
      roleNome: input.roleNome,
      permitirTudo: input.permitirTudo,
      tipos: (input.tipos || []).filter((t) => typeof t === "string"),
    });

    revalidatePath("/configuracoes");
    revalidatePath("/tramitacoes");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar permissões de demanda:", error);
    return { success: false, error: "Falha ao salvar. Verifique a conexão com o Directus." };
  }
}
