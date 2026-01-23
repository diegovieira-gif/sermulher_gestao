"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { Evento, insertEventoSchema } from "./schemas";

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

export type TipoEventoOption = { id: number; nome: string; icone?: string };

// --- Opções Auxiliares (Correção do Erro de Export) ---

export async function getTiposOptions(): Promise<{
  success: boolean;
  data?: TipoEventoOption[];
  error?: string;
}> {
  try {
    // Busca os tipos de evento para o select
    const tipos = await directus.request(
      readItems("config_tipos_evento", {
        fields: ["id", "nome", "icone"],
        sort: ["nome"],
      }),
    );
    // @ts-ignore
    return { success: true, data: tipos };
  } catch (error) {
    console.error("Erro ao buscar tipos de evento:", error);
    // Retorna array vazio em vez de erro para não quebrar a página toda
    return { success: true, data: [] };
  }
}

// --- CRUD de Eventos (Tabela: eventos_campanhas) ---

export async function saveEvento(data: Evento & { id?: number }) {
  if (data.id) {
    return updateEvento(data.id, data);
  } else {
    return createEvento(data);
  }
}

export async function createEvento(data: Evento) {
  const validation = insertEventoSchema.safeParse(data);
  if (!validation.success) return { success: false, error: "Dados inválidos" };

  try {
    await directus.request(createItem("eventos_campanhas", validation.data));
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return { success: false, error: "Erro ao criar evento" };
  }
}

export async function updateEvento(id: number, data: Evento) {
  const validation = insertEventoSchema.safeParse(data);
  if (!validation.success) return { success: false, error: "Dados inválidos" };

  try {
    // @ts-ignore
    const { id: _, ...payload } = data;
    await directus.request(
      updateItem("eventos_campanhas", id, validation.data),
    );
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return { success: false, error: "Erro ao atualizar evento" };
  }
}

export async function deleteEvento(id: number) {
  try {
    await directus.request(deleteItem("eventos_campanhas", id));
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return { success: false, error: "Erro ao excluir evento" };
  }
}

// --- BUSCA UNIFICADA (Calendário) ---

export async function getGlobalEvents(): Promise<{
  success: boolean;
  data?: CalendarEvent[];
  error?: string;
}> {
  try {
    const globalEvents: CalendarEvent[] = [];

    // Usamos Promise.allSettled para tolerância a falhas
    const [manuaisResult, turmasResult, sessoesResult] =
      await Promise.allSettled([
        // 1. Eventos Manuais (eventos_campanhas)
        // @ts-ignore
        directus.request(
          readItems("eventos_campanhas", {
            fields: [
              "id",
              "nome",
              "data_inicio",
              "data_fim",
              "descricao",
              "tipo_id.nome",
              "status",
            ],
            limit: -1,
          }),
        ),

        // 2. Turmas (escola_turmas)
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

        // 3. Sessões (ciclo_sessoes)
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
          title: evt.nome, // Campo correto é 'nome'
          start: new Date(evt.data_inicio),
          end: new Date(evt.data_fim || evt.data_inicio),
          allDay: false,
          type: "manual",
          color: "#a855f7", // Purple (Identidade visual da página)
          description: evt.descricao,
          status: evt.status,
        });
      });
    }

    // Processar Turmas
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
            color: "#059669", // Emerald
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
    }

    // Processar Sessões Sala Azul
    if (sessoesResult.status === "fulfilled" && sessoesResult.value) {
      sessoesResult.value.forEach((sessao: any) => {
        if (sessao.data) {
          globalEvents.push({
            id: `sessao-${sessao.id}`,
            title: `Sala Azul: ${sessao.tema || "Encontro"}`,
            start: new Date(sessao.data),
            end: new Date(sessao.data),
            allDay: false,
            type: "sala_azul",
            color: "#2563eb", // Blue
            description: `Ciclo: ${sessao.sala_id?.nome_ciclo || "Geral"}`,
            status: "agendada",
          });
        }
      });
    }

    return { success: true, data: globalEvents };
  } catch (error) {
    console.error("Erro crítico no calendário:", error);
    return { success: false, error: "Falha ao carregar calendário" };
  }
}
