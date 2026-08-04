"use server";

import { getDirectusAdmin, getDirectusClient } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { Evento, insertEventoSchema } from "./schemas";
import { participacaoEventoSchema } from "../mulheres/beneficiarias/schemas";

/**
 * Autoriza o usuário no módulo "eventos" e devolve o cliente admin (lazy).
 * Toda action deste arquivo DEVE obter o cliente por aqui.
 */
async function getEventosDirectus() {
  await assertAccess("eventos");
  return getDirectusAdmin();
}

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
  const directus = await getEventosDirectus();
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
  const directus = await getEventosDirectus();
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
  const directus = await getEventosDirectus();
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
  const directus = await getEventosDirectus();
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
  const directus = await getEventosDirectus();
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
              "tipo_id.id",
              "tipo_id.nome",
              "tipo",
              "recorrencia",
              "local",
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
          status: evt.tipo,
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

// --- Participantes por evento (coleção participacoes_evento) ----------------
//
// É o outro lado da vinculação já existente na ficha da beneficiária
// (mulheres/beneficiarias/[id] → aba Eventos). A mesma coleção, lida a partir
// do evento em vez da pessoa.
//
// Diferente do restante deste arquivo, estas actions usam o token DO USUÁRIO e
// não `getDirectusAdmin()`. A lista expõe nomes e CPFs de mulheres em situação
// de violência: manter o token do usuário preserva as permissões do Directus
// como segunda barreira, em vez de depender só do gate de menu da aplicação.

export type ParticipanteEvento = {
  id: number;
  data_participacao: string | null;
  observacao?: string | null;
  beneficiaria?: {
    id: number;
    nome_completo?: string | null;
    cpf?: string | null;
    telefone?: string | null;
  } | null;
};

export type BeneficiariaParaEvento = {
  id: number;
  nome_completo: string;
  cpf?: string | null;
};

export async function getParticipantesEvento(eventoId: number) {
  await assertAccess("eventos");
  try {
    const directus = await getDirectusClient({ requireAuth: true });
    const participantes = await directus.request(
      readItems("participacoes_evento", {
        filter: { evento: { _eq: eventoId } },
        sort: ["-data_participacao"],
        fields: [
          "id",
          "data_participacao",
          "observacao",
          "beneficiaria.id",
          "beneficiaria.nome_completo",
          "beneficiaria.cpf",
          "beneficiaria.telefone",
        ],
        limit: -1,
      }),
    );
    return {
      success: true,
      data: participantes as unknown as ParticipanteEvento[],
    };
  } catch (error) {
    console.error("Erro ao buscar participantes do evento:", error);
    return { success: false, error: "Falha ao carregar os participantes." };
  }
}

export async function getBeneficiariasParaEvento() {
  await assertAccess("eventos");
  try {
    const directus = await getDirectusClient({ requireAuth: true });
    const beneficiarias = await directus.request(
      readItems("beneficiarias", {
        fields: ["id", "nome_completo", "cpf"],
        sort: ["nome_completo"],
        limit: -1,
      }),
    );
    return {
      success: true,
      data: beneficiarias as unknown as BeneficiariaParaEvento[],
    };
  } catch (error) {
    console.error("Erro ao carregar beneficiárias:", error);
    return { success: false, data: [] as BeneficiariaParaEvento[] };
  }
}

export async function registrarParticipanteEvento(input: {
  evento: number;
  beneficiaria: number;
  data_participacao: string;
  observacao?: string;
}) {
  await assertAccess("eventos");

  const validacao = participacaoEventoSchema.safeParse(input);
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0];
    return { success: false, error: primeiro?.message || "Dados inválidos." };
  }
  const dados = validacao.data;

  try {
    const directus = await getDirectusClient({ requireAuth: true });

    // Impede registrar a mesma beneficiária duas vezes no mesmo evento — a
    // coleção não tem restrição de unicidade e, pelo lado do evento, repetir
    // é fácil demais.
    const jaExiste = (await directus.request(
      readItems("participacoes_evento", {
        filter: {
          evento: { _eq: dados.evento },
          beneficiaria: { _eq: dados.beneficiaria },
        },
        fields: ["id"],
        limit: 1,
      }),
    )) as Array<{ id: number }>;

    if (jaExiste.length > 0) {
      return {
        success: false,
        error: "Esta beneficiária já está registrada neste evento.",
      };
    }

    await directus.request(
      createItem("participacoes_evento", {
        evento: dados.evento,
        beneficiaria: dados.beneficiaria,
        data_participacao: dados.data_participacao,
        observacao: dados.observacao || null,
      }),
    );

    revalidatePath("/eventos");
    revalidatePath(`/mulheres/beneficiarias/${dados.beneficiaria}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar participante:", error);
    return { success: false, error: "Erro ao registrar a participação." };
  }
}

export async function removerParticipanteEvento(id: number) {
  await assertAccess("eventos");
  try {
    const directus = await getDirectusClient({ requireAuth: true });
    await directus.request(deleteItem("participacoes_evento", id));
    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover participante:", error);
    return { success: false, error: "Erro ao remover a participação." };
  }
}
