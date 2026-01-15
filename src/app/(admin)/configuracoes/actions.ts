"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";

/**
 * Tipos de collections de configuração disponíveis
 */
export type ConfigCollection =
  | "config_origens"
  | "config_prioridades"
  | "config_tipos_evento"
  | "config_tipos_agressao"
  | "config_niveis_periculosidade";

/**
 * Busca todos os itens de uma collection de configuração
 */
export async function getAuxItems(collection: ConfigCollection) {
  try {
    const items = await directus.request(
      readItems(collection, {
        fields: ["*"],
        sort: ["nome"],
      })
    );

    return { success: true, data: items };
  } catch (error) {
    console.error(`Erro ao buscar itens de ${collection}:`, error);
    return {
      success: false,
      error: `Erro ao buscar itens. Tente novamente.`,
    };
  }
}

/**
 * Salva um item de configuração (cria ou atualiza)
 */
export async function saveAuxItem(
  collection: ConfigCollection,
  data: { id?: number; nome: string; [key: string]: any }
) {
  try {
    if (data.id) {
      // Atualiza item existente
      const { id, ...updateData } = data;

      await directus.request(updateItem(collection, id, updateData));

      revalidatePath("/configuracoes");
      return {
        success: true,
        message: "Item atualizado com sucesso!",
      };
    } else {
      // Cria novo item
      const { id, ...createData } = data;

      await directus.request(createItem(collection, createData));

      revalidatePath("/configuracoes");
      return {
        success: true,
        message: "Item cadastrado com sucesso!",
      };
    }
  } catch (error) {
    console.error(`Erro ao salvar item em ${collection}:`, error);

    return {
      success: false,
      error: "Erro ao salvar item. Tente novamente.",
    };
  }
}

/**
 * Deleta um item de configuração
 */
export async function deleteAuxItem(collection: ConfigCollection, id: number) {
  try {
    await directus.request(deleteItem(collection, id));

    revalidatePath("/configuracoes");
    return {
      success: true,
      message: "Item excluído com sucesso!",
    };
  } catch (error) {
    console.error(`Erro ao excluir item de ${collection}:`, error);
    return {
      success: false,
      error: "Erro ao excluir item. Tente novamente.",
    };
  }
}
