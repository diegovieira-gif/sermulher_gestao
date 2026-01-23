"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { InsertEvento, insertEventoSchema } from "./schemas";

// --- Tipos Unificados ---
export type CalendarEvent = {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  type: "manual" | "escola" | "sala_azul";
  color: string;
  description?: string;
  status?: string;
};

// --- CRUD de Eventos Manuais ---

// Função Wrapper que o Form espera
export async function saveEvento(data: InsertEvento & { id?: number }) {
  if (data.id) {
    return updateEvento(data.id, data);
  } else {
    return createEvento(data);
  }
}

export async function createEvento(data: InsertEvento) {
  const validation = insertEventoSchema.safeParse(data);
  if (!validation.success) return { success: false, error: "Dados inválidos" };

  try {
    await directus.request(createItem("eventos", validation.data));
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao criar evento" };
  }
}

export async function updateEvento(id: number, data: InsertEvento) {
  const validation = insertEventoSchema.safeParse(data);
  if (!validation.success) return { success: false, error: "Dados inválidos" };

  try {
    // @ts-ignore
    const { id: _, ...payload } = data;
    await directus.request(updateItem("eventos", id, validation.data));
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao atualizar evento" };
  }
}

export async function deleteEvento(id: number) {
  try {
    await directus.request(deleteItem("eventos", id));
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir evento" };
  }
}

// --- BUSCA UNIFICADA ---

export async function getGlobalEvents(): Promise<{
  success: boolean;
  data?: CalendarEvent[];
  error?: string;
}> {
  try {
    const globalEvents: CalendarEvent[] = [];

    // 1. Buscar Eventos Manuais (Tabela 'eventos')
    // Usamos Promise.allSettled para que o erro em uma tabela não quebre as outras
    const [manuaisResult, turmasResult, sessoesResult] =
      await Promise.allSettled([
        directus.request(readItems("eventos", { limit: -1 })),

        // Tenta buscar turmas (Pode falhar se campos de data não existirem ainda)
        // @ts-ignore
        directus.request(
          readItems("escola_turmas", {
            fields: [
              "id",
              "nome",
              "data_inicio",
              "data_fim",
              "status",
              "curso.nome",
            ],
            filter: {
              status: { _in: ["aberta", "em_andamento", "concluida"] },
            },
            limit: -1,
          }),
        ),

        // Busca Sessões da Sala Azul (Tabela 'ciclo_sessoes')
        // @ts-ignore
        directus.request(
          readItems("ciclo_sessoes", {
            fields: ["id", "data", "tema", "sala_id.nome_ciclo"],
            limit: -1,
          }),
        ),
      ]);

    // Processar Manuais
    if (manuaisResult.status === "fulfilled" && manuaisResult.value) {
      manuaisResult.value.forEach((evt: any) => {
        globalEvents.push({
          id: `manual-${evt.id}`,
          title: evt.titulo,
          start: new Date(evt.data_inicio),
          end: new Date(evt.data_fim || evt.data_inicio),
          allDay: evt.dia_inteiro || false,
          type: "manual",
          color: evt.cor || "#6366f1",
          description: evt.descricao,
          status: "ativo",
        });
      });
    }

    // Processar Turmas (Se sucesso)
    if (turmasResult.status === "fulfilled" && turmasResult.value) {
      turmasResult.value.forEach((turma: any) => {
        if (turma.data_inicio) {
          globalEvents.push({
            id: `turma-ini-${turma.id}`,
            title: `Início: ${turma.nome}`,
            start: new Date(turma.data_inicio),
            end: new Date(turma.data_inicio),
            allDay: true,
            type: "escola",
            color: "#059669",
            description: `Curso: ${turma.curso?.nome}`,
            status: turma.status,
          });
        }
        if (turma.data_fim) {
          globalEvents.push({
            id: `turma-fim-${turma.id}`,
            title: `Formatura: ${turma.nome}`,
            start: new Date(turma.data_fim),
            end: new Date(turma.data_fim),
            allDay: true,
            type: "escola",
            color: "#059669",
            description: `Encerramento da turma`,
            status: turma.status,
          });
        }
      });
    } else {
      console.warn(
        "Não foi possível carregar turmas (verifique se os campos data_inicio/data_fim existem).",
      );
    }

    // Processar Sessões Sala Azul (Se sucesso)
    if (sessoesResult.status === "fulfilled" && sessoesResult.value) {
      sessoesResult.value.forEach((sessao: any) => {
        if (sessao.data) {
          globalEvents.push({
            id: `sessao-${sessao.id}`,
            title: `Sala Azul: ${sessao.tema || "Encontro"}`,
            start: new Date(sessao.data), // Campo correto é 'data'
            end: new Date(sessao.data),
            allDay: false,
            type: "sala_azul",
            color: "#2563eb",
            description: `Ciclo: ${sessao.sala_id?.nome_ciclo || "Geral"}`,
            status: "agendada",
          });
        }
      });
    } else {
      console.error(
        "Erro ao carregar sessões:",
        sessoesResult.status === "rejected" ? sessoesResult.reason : "Unknown",
      );
    }

    return { success: true, data: globalEvents };
  } catch (error) {
    console.error("Erro crítico no calendário:", error);
    return { success: false, error: "Falha ao carregar calendário" };
  }
}
