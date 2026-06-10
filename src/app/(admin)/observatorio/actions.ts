
"use server";

import { directus, getDirectusAdmin } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { ObserCollection } from "./types";

export async function getCollectionData(collection: ObserCollection, search?: string) {
  try {
    const filter: any = {};
    
    if (search) {
      if (collection === "obser_dashboards") {
        filter._or = [
          { period_label: { _contains: search } },
          { cram_periodo: { _contains: search } },
        ];
      } else {
        filter._or = [
          { nome: { _contains: search } },
          { titulo: { _contains: search } },
          { serie_nome: { _contains: search } },
        ];
      }
    }

    const sort = collection === "obser_dashboards" ? ["-id"] : ["ordem", "-id"];
    const adminDirectus = getDirectusAdmin();

    const items = await adminDirectus.request(
      readItems(collection as any, {
        filter,
        sort,
        limit: 100,
        fields: ['*']
      })
    );

    return { success: true, data: items };
  } catch (error: any) {
    console.error(`Error fetching ${collection}:`, error);
    if (error.response?.status === 403) {
      return { success: false, error: "Você não tem permissão para acessar esta coleção.", status: 403 };
    }
    return { success: false, error: "Erro ao carregar dados do Directus." };
  }
}

export async function saveItem(collection: ObserCollection, data: any, id?: number) {
  try {
    let result;
    const adminDirectus = getDirectusAdmin();
    if (id) {
      result = await adminDirectus.request(updateItem(collection as any, id, data));
    } else {
      result = await adminDirectus.request(createItem(collection as any, data));
    }
    revalidatePath("/observatorio");
    return { success: true, data: result };
  } catch (error: any) {
    console.error(`Error saving ${collection}:`, error);
    return { success: false, error: "Erro ao salvar item." };
  }
}

export async function removeItem(collection: ObserCollection, id: number) {
  try {
    const adminDirectus = getDirectusAdmin();
    await adminDirectus.request(deleteItem(collection as any, id));
    revalidatePath("/observatorio");
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting from ${collection}:`, error);
    return { success: false, error: "Erro ao excluir item." };
  }
}

export async function getRelationData(collection: string) {
  try {
    const fields = collection === 'obser_periodos' ? ['id', 'nome'] : ['id', 'nome', 'titulo'];
    const adminDirectus = getDirectusAdmin();
    const items = await adminDirectus.request(
      readItems(collection as any, {
        limit: -1,
        fields: fields as any[]
      })
    );
    return { success: true, data: items };
  } catch (error) {
    console.error(`Error fetching relation ${collection}:`, error);
    return { success: false, error: "Erro ao carregar dados de relação." };
  }
}
