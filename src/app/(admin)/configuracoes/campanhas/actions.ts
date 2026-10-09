"use server";

import { directus, getDirectusAdmin } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { normalizarStatusCampanha } from "../schemas";

const COLLECTION = "config_campanhas";

export type Campanha = {
  id?: number;
  nome: string;
  mes?: string | null;
  cor?: string | null;
  status?: "ativo" | "inativo";
};

// Lista TODAS as campanhas: esta é a tela de gestão, onde uma campanha
// inativa precisa aparecer para poder ser reativada ou corrigida. Filtrar por
// status é papel dos selects que oferecem campanhas para escolha.
export async function getCampanhas() {
  await assertAccess("configuracoes");
  try {
    const adminDirectus = getDirectusAdmin();
    // @ts-ignore fields are dynamic
    const items = await adminDirectus.request(
      readItems(COLLECTION, {
        sort: ["id"],
        limit: -1,
      }),
    );
    // Registros gravados pela aba principal antigamente vinham como
    // "published"/"draft"; aqui todos saem como "ativo"/"inativo".
    const data = (items as Campanha[]).map((c) => ({
      ...c,
      status: normalizarStatusCampanha(c.status),
    }));
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return { success: false, data: [] };
  }
}

// Criar/Atualizar campanha
export async function saveCampanha(data: Campanha) {
  await assertAccess("configuracoes");
  try {
    const { id, ...payload } = data || {};

    if (id) {
      await directus.request(updateItem(COLLECTION, id, payload));
    } else {
      await directus.request(createItem(COLLECTION, payload));
    }

    revalidatePath("/configuracoes");
    revalidatePath("/marketing");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar campanha:", error);
    return { success: false, error: "Erro ao salvar campanha." };
  }
}

// Deletar campanha
export async function deleteCampanha(id: number) {
  await assertAccess("configuracoes");
  try {
    await directus.request(deleteItem(COLLECTION, id));
    revalidatePath("/configuracoes");
    revalidatePath("/marketing");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir campanha:", error);
    return { success: false, error: "Erro ao excluir campanha." };
  }
}
