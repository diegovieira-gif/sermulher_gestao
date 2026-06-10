"use server";

import { directus, getDirectusAdmin } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";

const COLLECTION = "config_campanhas";

export type Campanha = {
  id?: number;
  nome: string;
  mes?: string | null;
  cor?: string | null;
  status?: "ativo" | "inativo";
};

// Listar apenas campanhas ativas
export async function getCampanhas() {
  try {
    const adminDirectus = getDirectusAdmin();
    // @ts-ignore fields are dynamic
    const items = await adminDirectus.request(
      readItems(COLLECTION, {
        filter: { status: { _eq: "ativo" } },
        sort: ["id"],
      }),
    );
    return { success: true, data: items };
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return { success: false, data: [] };
  }
}

// Criar/Atualizar campanha
export async function saveCampanha(data: Campanha) {
  try {
    const { id, ...payload } = data || {};

    if (id) {
      await directus.request(updateItem(COLLECTION, id, payload));
    } else {
      await directus.request(createItem(COLLECTION, payload));
    }

    revalidatePath("/admin/configuracoes");
    revalidatePath("/admin/marketing");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar campanha:", error);
    return { success: false, error: "Erro ao salvar campanha." };
  }
}

// Deletar campanha
export async function deleteCampanha(id: number) {
  try {
    await directus.request(deleteItem(COLLECTION, id));
    revalidatePath("/admin/configuracoes");
    revalidatePath("/admin/marketing");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir campanha:", error);
    return { success: false, error: "Erro ao excluir campanha." };
  }
}
