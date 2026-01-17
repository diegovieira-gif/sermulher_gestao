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

/**
 * Tipo para evento da agenda
 */
export type AgendaEvent = {
  id: number;
  date: Date;
  title: string;
  subtitle: string;
  type: "sessao";
};

/**
 * Busca eventos da agenda (sessões dos ciclos da Sala Azul)
 * Por enquanto busca todas as sessões futuras, independente do mês
 */
export async function getAgendaEvents(
  month?: Date
): Promise<
  | { success: true; data: AgendaEvent[] }
  | { success: false; error: string; data: [] }
> {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Busca todas as sessões futuras ou do mês especificado
    // Com relacionamentos: sala_id.nome_ciclo e sala_id.local_id.nome
    // Nota: O Directus transforma o campo "local" em "local_id" ao expandir relacionamentos
    const sessoes = await directus.request(
      readItems("ciclo_sessoes", {
        fields: [
          "id",
          "data",
          "tema",
          "sala_id.id",
          "sala_id.nome_ciclo",
          "sala_id.local_id.id",
          "sala_id.local_id.nome",
        ],
        filter: month
          ? {
              // Filtrar pelo mês se especificado
              data: {
                _gte: new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  1
                ).toISOString(),
                _lt: new Date(
                  month.getFullYear(),
                  month.getMonth() + 1,
                  1
                ).toISOString(),
              },
            }
          : {
              // Ou apenas sessões futuras
              data: {
                _gte: hoje.toISOString(),
              },
            },
        sort: ["data"],
      })
    );

    // Transforma os dados no formato esperado
    const eventos: AgendaEvent[] = (sessoes || []).map((sessao: any) => {
      const dataStr = sessao.data;
      const data = new Date(dataStr);

      // Acessa os relacionamentos
      const sala =
        typeof sessao.sala_id === "object" && sessao.sala_id !== null
          ? sessao.sala_id
          : null;

      const nomeCiclo = sala?.nome_ciclo || "Ciclo sem nome";
      // Tenta local ou local_id (dependendo de como o Directus retorna)
      const local =
        (typeof sala?.local === "object" && sala?.local !== null
          ? sala.local
          : null) ||
        (typeof sala?.local_id === "object" && sala?.local_id !== null
          ? sala.local_id
          : null);
      const nomeLocal = local?.nome || "Local não informado";

      return {
        id: sessao.id,
        date: data,
        title: sessao.tema || "Sessão sem tema",
        subtitle: `${nomeCiclo} - ${nomeLocal}`,
        type: "sessao" as const,
      };
    });

    return {
      success: true,
      data: eventos,
    };
  } catch (error) {
    console.error("Erro ao buscar eventos da agenda:", error);
    return {
      success: false,
      error: "Erro ao buscar eventos da agenda. Tente novamente.",
      data: [],
    };
  }
}
