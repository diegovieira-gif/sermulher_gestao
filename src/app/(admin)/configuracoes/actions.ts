"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";

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
  | "locais"
  | "setores"
  | "config_raca_cor"
  | "config_estado_civil"
  | "config_escolaridade"
  | "config_situacao_trabalho"
  | "config_integracao";

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
  "setores", // Adicionado
  "config_origens",
  "config_prioridades",
  "config_tipos_evento",
  "config_tipos_agressao",
  "config_niveis_periculosidade",
  "config_status_legal",
  "config_bairros",
  "config_beneficios",
  "config_encaminhamentos",
  "config_campanhas",
  "config_raca_cor",
  "config_estado_civil",
  "config_escolaridade",
  "config_situacao_trabalho",
  "config_integracao",
  "raca-cor",
  "estado-civil",
  "escolaridade",
  "situacao-trabalho",
] as const;

function getCollectionName(type: string): ConfigCollection {
  if (!ALLOWED_TYPES.includes(type as any)) {
    throw new Error(`Tipo "${type}" não é permitido para operações CRUD`);
  }

  // Verifica se é um tipo direto (config_*, locais ou setores)
  if (type.startsWith("config_") || type === "locais" || type === "setores") {
    return type as ConfigCollection;
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
    case "tipos-violencia":
    case "tipos_violencia":
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
    case "raca-cor":
      return "config_raca_cor";
    case "estado-civil":
      return "config_estado_civil";
    case "escolaridade":
      return "config_escolaridade";
    case "situacao-trabalho":
      return "config_situacao_trabalho";
    default:
      throw new Error(`Tipo "${type}" não possui mapeamento para collection`);
  }
}

export async function getAuxItems(type: string) {
  try {
    const collectionName = getCollectionName(type);
    // @ts-ignore
    const items = await directus.request(
      readItems(collectionName, { limit: -1, sort: ["nome"] }),
    );
    return { success: true, data: items };
  } catch (error) {
    console.error(`Erro ao buscar ${type}:`, error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Erro ao buscar dados.",
    };
  }
}

export async function saveAuxItem(
  type: string,
  data: { id?: number; nome: string;[key: string]: any },
) {
  try {
    const collection = getCollectionName(type);
    const { id, ...payload } = data;

    if (id) {
      await directus.request(updateItem(collection, id, payload));
    } else {
      await directus.request(createItem(collection, payload));
    }

    // Revalidação de Cache Global
    revalidatePath("/configuracoes");
    revalidatePath("/eventos");
    revalidatePath("/dashboard");
    revalidatePath("/sala-azul/ciclos");
    revalidatePath("/sala-azul/infratores");
    revalidatePath("/mulheres");
    revalidatePath("/tramitacoes");

    return { success: true };
  } catch (error) {
    console.error(`Erro ao salvar ${type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao salvar.",
    };
  }
}

export async function deleteAuxItem(type: string, id: number) {
  try {
    const collection = getCollectionName(type);
    await directus.request(deleteItem(collection, id));

    // Revalidação de Cache Global
    revalidatePath("/configuracoes");
    revalidatePath("/eventos");
    revalidatePath("/dashboard");
    revalidatePath("/sala-azul/ciclos");
    revalidatePath("/sala-azul/infratores");
    revalidatePath("/mulheres");
    revalidatePath("/tramitacoes");

    return { success: true };
  } catch (error) {
    console.error(`Erro ao excluir ${type}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir.",
    };
  }
}
