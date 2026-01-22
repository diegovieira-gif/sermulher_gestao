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
 * Whitelist de tipos permitidos para operações CRUD
 * Esta é a única fonte de verdade para validação de segurança
 */
const ALLOWED_TYPES = [
  "origens",
  "prioridades",
  "tipos-evento",
  "tipos_evento",
  "tipos-agressao",
  "tipos_agressao",
  "tipos-violencia",
  "tipos_violencia",
  "periculosidade",
  "status-legal",
  "status_legal",
  "bairros",
  "beneficios",
  "encaminhamentos",
  "campanhas",
  "locais",
] as const;

/**
 * Retorna o nome da collection baseado no tipo
 * Função interna apenas para as Actions usarem.
 * Valida contra whitelist para segurança.
 */
function getCollectionName(type: string): ConfigCollection {
  // Validação de segurança: apenas tipos permitidos
  if (!ALLOWED_TYPES.includes(type as any)) {
    throw new Error(`Tipo "${type}" não é permitido para operações CRUD`);
  }

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
    case "status-legal":
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
      throw new Error(`Tipo "${type}" não possui mapeamento para collection`);
  }
}

/**
 * Busca itens de uma collection específica usando o tipo (ex: "origens")
 * Mapeia internamente para o nome da collection no banco (ex: "config_origens")
 * Valida contra whitelist para segurança
 */
export async function getAuxItems(type: string) {
  try {
    const collectionName = getCollectionName(type);
    
    // @ts-ignore
    const items = await directus.request(
      readItems(collectionName, {
        limit: -1,
        sort: ["nome"],
      }),
    );

    return { success: true, data: items };
  } catch (error) {
    console.error(`Erro ao buscar ${type}:`, error);
    // Retorna array vazio em caso de erro para não quebrar a página
    return { success: false, data: [], error: error instanceof Error ? error.message : "Erro ao buscar dados." };
  }
}

/**
 * Salva um item de configuração (cria ou atualiza)
 * Valida o tipo contra whitelist antes de executar
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao salvar." 
    };
  }
}

/**
 * Deleta um item de configuração
 * Valida o tipo contra whitelist antes de executar
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao excluir." 
    };
  }
}
