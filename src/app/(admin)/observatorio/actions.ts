
"use server";

import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { ObserCollection } from "./types";

export async function getCollectionData(collection: ObserCollection, search?: string) {
  try {
    const filter: any = {};
    
    if (search) {
      // Assuming 'nome' or 'titulo' or 'serie_nome' are the main searchable fields
      filter._or = [
        { nome: { _contains: search } },
        { titulo: { _contains: search } },
        { serie_nome: { _contains: search } },
      ];
    }

    const items = await directus.request(
      readItems(collection as any, {
        filter,
        sort: ["ordem", "-id"],
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
    if (id) {
      result = await directus.request(updateItem(collection as any, id, data));
    } else {
      result = await directus.request(createItem(collection as any, data));
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
    await directus.request(deleteItem(collection as any, id));
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
    const items = await directus.request(
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
