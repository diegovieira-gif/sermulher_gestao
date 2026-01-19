"use server"; // <--- Diretiva no topo: Torna tudo aqui Server-Side

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";

/**
 * Tipos de collections de configuração disponíveis
 * (Tipos podem ser exportados normalmente para o cliente)
 */
export type ConfigCollection =
  | "config_origens"
  | "config_prioridades"
  | "config_tipos_evento"
  | "config_tipos_agressao"
  | "config_niveis_periculosidade"
  | "config_status_legal"
  | "config_bairros"
  | "config_beneficios"
  | "config_encaminhamentos"
  | "config_campanhas"
  | "locais";

/**
 * Retorna o nome da collection baseado no tipo
 * REMOVIDO "export": Agora é uma função interna apenas para as Actions usarem.
 * Isso evita o erro de "Server Actions must be async" para funções helpers.
 */
function getCollectionName(type: string): string {
  switch (type) {
    case "origens":
      return "config_origens";
    case "prioridades":
      return "config_prioridades";
    case "tipos-evento":
    case "tipos_evento":
      return "config_tipos_evento";
    case "tipos-agressao":
    case "tipos_agressao":
      return "config_tipos_agressao";
    case "tipos-violencia":
    case "tipos_violencia":
      // Mapeamos "tipos-violencia" (usado na URL/Tabs) para a collection real "config_tipos_agressao"
      return "config_tipos_agressao";
    case "periculosidade":
      return "config_niveis_periculosidade";
    case "status_legal":
      return "config_status_legal";
    case "bairros":
      return "config_bairros";
    case "beneficios":
      return "config_beneficios";
    case "encaminhamentos":
      return "config_encaminhamentos";
    case "campanhas":
      return "config_campanhas";
    case "locais":
      return "locais";
    default:
      return type;
  }
}

/**
 * Busca itens de uma collection específica
 */
export async function getAuxItems(collectionName: string) {
  try {
    // @ts-ignore
    const items = await directus.request(
      readItems(collectionName, {
        limit: -1,
        sort: ["nome"],
      }),
    );

    return { success: true, data: items };
  } catch (error) {
    console.error(`Erro ao buscar ${collectionName}:`, error);
    return { success: false, error: "Erro ao buscar dados." };
  }
}

/**
 * Salva um item de configuração (cria ou atualiza)
 */
export async function saveAuxItem(
  type: string,
  data: { id?: number; nome: string; [key: string]: any },
) {
  try {
    const collection = getCollectionName(type);
    const { id, ...payload } = data;

    if (id) {
      await directus.request(updateItem(collection, id, payload));
    } else {
      await directus.request(createItem(collection, payload));
    }

    revalidatePath("/configuracoes");
    revalidatePath("/sala-azul/ciclos");
    revalidatePath("/sala-azul/infratores");

    return { success: true };
  } catch (error) {
    console.error(`Erro ao salvar ${type}:`, error);
    return { success: false, error: "Erro ao salvar." };
  }
}

/**
 * Deleta um item de configuração
 */
export async function deleteAuxItem(type: string, id: number) {
  try {
    const collection = getCollectionName(type);
    await directus.request(deleteItem(collection, id));

    revalidatePath("/configuracoes");
    revalidatePath("/sala-azul/ciclos");
    revalidatePath("/sala-azul/infratores");

    return { success: true };
  } catch (error) {
    console.error(`Erro ao excluir ${type}:`, error);
    return { success: false, error: "Erro ao excluir." };
  }
}
