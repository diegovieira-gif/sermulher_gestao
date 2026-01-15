"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { insertEventoSchema, type Evento } from "./schemas";

type TipoEventoOption = { id: number; nome: string; icone?: string };

/**
 * Busca todos os eventos do Directus ordenados por data_inicio descrescente
 */
export async function getEventos() {
  try {
    const eventos = await directus.request(
      readItems("eventos_campanhas", {
        fields: [
          "*",
          "tipo_id.nome",
          "tipo_id.icone",
        ],
        sort: ["-data_inicio"],
      })
    );

    return { success: true, data: eventos };
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return {
      success: false,
      error: "Erro ao buscar eventos. Tente novamente.",
    };
  }
}

/**
 * Busca opções de tipos de evento do banco de dados
 */
export async function getTiposOptions(): Promise<
  | { success: true; data: TipoEventoOption[] }
  | { success: false; error: string }
> {
  try {
    const tipos = (await directus.request(
      readItems("config_tipos_evento", {
        fields: ["id", "nome", "icone"],
        sort: ["nome"],
      })
    )) as TipoEventoOption[];

    return { success: true, data: tipos };
  } catch (error) {
    console.error("Erro ao buscar tipos de evento (options):", error);
    return {
      success: false,
      error: "Erro ao buscar tipos de evento. Tente novamente.",
    };
  }
}

/**
 * Salva um evento (cria ou atualiza)
 */
export async function saveEvento(data: unknown) {
  try {
    // Valida os dados com Zod
    const validatedData = insertEventoSchema.parse(data);

    if (validatedData.id) {
      // Atualiza evento existente
      const { id, ...updateData } = validatedData;

      await directus.request(
        updateItem("eventos_campanhas", id, updateData)
      );

      revalidatePath("/eventos");
      return {
        success: true,
        message: "Evento atualizado com sucesso!",
      };
    } else {
      // Cria novo evento
      const { id, ...createData } = validatedData;

      await directus.request(
        createItem("eventos_campanhas", createData)
      );

      revalidatePath("/eventos");
      return {
        success: true,
        message: "Evento cadastrado com sucesso!",
      };
    }
  } catch (error) {
    console.error("Erro ao salvar evento:", error);

    // Erro de validação do Zod
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar evento. Tente novamente.",
    };
  }
}

/**
 * Deleta um evento
 */
export async function deleteEvento(id: number) {
  try {
    await directus.request(deleteItem("eventos_campanhas", id));

    revalidatePath("/eventos");
    return {
      success: true,
      message: "Evento excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return {
      success: false,
      error: "Erro ao excluir evento. Tente novamente.",
    };
  }
}
