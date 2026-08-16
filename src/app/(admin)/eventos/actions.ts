"use server";

import { getDirectusAdmin, getDirectusClient } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import {
  createItem,
  deleteItem,
  readItems,
  readUsers,
  updateItem,
} from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { Evento, insertEventoSchema, membroEquipeEventoSchema } from "./schemas";
import { participacaoEventoSchema } from "../mulheres/beneficiarias/schemas";
import {
  calcularLembrete,
  cancelarPendentes,
  descreverQuando,
  enfileirar,
  type NovaNotificacao,
} from "@/lib/notificacoes";

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
    // Estado anterior, lido ANTES da gravação: é a única forma de saber se
    // data ou local mudaram e, portanto, se a equipe precisa ser reavisada.
    const anterior = (await directus.request(
      readItems("eventos_campanhas", {
        filter: { id: { _eq: id } },
        fields: ["nome", "data_inicio", "data_fim", "local"],
        limit: 1,
      }),
    )) as Array<{
      nome?: string;
      data_inicio?: string;
      data_fim?: string;
      local?: string;
    }>;

    await directus.request(
      updateItem("eventos_campanhas", id, validation.data),
    );

    const antes = anterior[0];
    if (antes) {
      const mudouInicio = antes.data_inicio !== validation.data.data_inicio;
      const mudouLocal = (antes.local ?? "") !== (validation.data.local ?? "");
      if (mudouInicio || mudouLocal) {
        await avisarEquipeSobreAlteracao(id, validation.data, {
          mudouInicio,
          mudouLocal,
          localAnterior: antes.local ?? null,
          inicioAnterior: antes.data_inicio ?? null,
        });
      }
    }

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

// --- Notificações da equipe ---------------------------------------------------

/** Dados do evento usados no texto dos avisos. */
async function lerEventoParaAviso(eventoId: number) {
  const directus = getDirectusAdmin();
  const linhas = (await directus.request(
    readItems("eventos_campanhas", {
      filter: { id: { _eq: eventoId } },
      fields: ["id", "nome", "data_inicio", "local"],
      limit: 1,
    }),
  )) as Array<{ id: number; nome?: string; data_inicio?: string; local?: string }>;
  return linhas[0] ?? null;
}

const ondeTexto = (local?: string | null) =>
  local && local.trim() ? `, em ${local.trim()}` : "";

/** Avisa a pessoa recém-escalada e agenda o lembrete da véspera. */
async function avisarEscalado(
  eventoId: number,
  usuarioId: string,
  vinculoId: number | string,
) {
  const evento = await lerEventoParaAviso(eventoId);
  if (!evento) return;

  const quando = descreverQuando(evento.data_inicio);
  const nome = evento.nome ?? "evento";
  const referencia = { colecao: "equipe_evento", id: vinculoId };

  const avisos: NovaNotificacao[] = [
    {
      destinatario: usuarioId,
      tipo: "escala_evento",
      titulo: `Você foi escalada para: ${nome}`,
      mensagem: `Você faz parte da equipe do evento "${nome}", em ${quando}${ondeTexto(evento.local)}.`,
      link: "/eventos",
      referencia,
    },
  ];

  // O lembrete só existe se a véspera ainda está no futuro; escalar alguém
  // para hoje não deve gerar aviso retroativo.
  const lembrete = evento.data_inicio ? calcularLembrete(evento.data_inicio) : null;
  if (lembrete) {
    avisos.push({
      destinatario: usuarioId,
      tipo: "lembrete_evento",
      titulo: `Amanhã: ${nome}`,
      mensagem: `Lembrete: você está escalada para "${nome}", em ${quando}${ondeTexto(evento.local)}.`,
      link: "/eventos",
      referencia,
      agendadaPara: lembrete,
    });
  }

  await enfileirar(avisos);
}

/** Avisa quem saiu da equipe e mata o lembrete que estava agendado. */
async function avisarRemocao(vinculoId: number, eventoId: number, usuarioId: string) {
  // Cancelar ANTES de enfileirar o aviso novo: senão o próprio aviso de
  // remoção entraria na varredura de cancelamento.
  await cancelarPendentes("equipe_evento", vinculoId);

  const evento = await lerEventoParaAviso(eventoId);
  const nome = evento?.nome ?? "evento";

  await enfileirar([
    {
      destinatario: usuarioId,
      tipo: "remocao_evento",
      titulo: `Você não está mais escalada para: ${nome}`,
      mensagem: `Sua participação na equipe do evento "${nome}" foi cancelada. Não é necessário comparecer.`,
      link: "/eventos",
      referencia: { colecao: "equipe_evento", id: vinculoId },
    },
  ]);
}

/**
 * Reavisa toda a equipe quando o evento muda de data ou local.
 *
 * Este é o gatilho que impede a notificação de virar desinformação: sem ele,
 * a pessoa iria ao lugar/dia do aviso antigo, confiando no sistema.
 */
async function avisarEquipeSobreAlteracao(
  eventoId: number,
  dados: { nome: string; data_inicio: string; local?: string },
  mudanca: {
    mudouInicio: boolean;
    mudouLocal: boolean;
    inicioAnterior: string | null;
    localAnterior: string | null;
  },
) {
  const directus = getDirectusAdmin();
  const equipe = (await directus.request(
    readItems("equipe_evento", {
      filter: { evento: { _eq: eventoId } },
      fields: ["id", "usuario"],
      limit: -1,
    }),
  )) as Array<{ id: number; usuario: string | null }>;

  if (equipe.length === 0) return;

  const partes: string[] = [];
  if (mudanca.mudouInicio) {
    partes.push(
      `a data passou de ${descreverQuando(mudanca.inicioAnterior)} para ${descreverQuando(dados.data_inicio)}`,
    );
  }
  if (mudanca.mudouLocal) {
    partes.push(
      `o local passou de "${mudanca.localAnterior || "não informado"}" para "${dados.local || "não informado"}"`,
    );
  }

  const avisos: NovaNotificacao[] = [];
  for (const membro of equipe) {
    if (!membro.usuario) continue;

    // O lembrete antigo aponta para a data velha — cancela e reagenda.
    await cancelarPendentes("equipe_evento", membro.id);

    avisos.push({
      destinatario: membro.usuario,
      tipo: "alteracao_evento",
      titulo: `Alteração no evento: ${dados.nome}`,
      mensagem: `O evento "${dados.nome}" foi alterado — ${partes.join(" e ")}.`,
      link: "/eventos",
      referencia: { colecao: "equipe_evento", id: membro.id },
    });

    const lembrete = calcularLembrete(dados.data_inicio);
    if (lembrete) {
      avisos.push({
        destinatario: membro.usuario,
        tipo: "lembrete_evento",
        titulo: `Amanhã: ${dados.nome}`,
        mensagem: `Lembrete: você está escalada para "${dados.nome}", em ${descreverQuando(dados.data_inicio)}${ondeTexto(dados.local)}.`,
        link: "/eventos",
        referencia: { colecao: "equipe_evento", id: membro.id },
        agendadaPara: lembrete,
      });
    }
  }

  await enfileirar(avisos);
}

// --- Equipe do evento (servidoras que atuaram) ------------------------------

export type MembroEquipe = {
  id: number;
  usuario: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
};

export type UsuarioParaEquipe = {
  id: string;
  nome: string;
  email?: string | null;
};

/** "Sobrenome, Nome" não; aqui é o nome como a pessoa é chamada no dia a dia. */
function nomeDoUsuario(u: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const nome = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return nome || u.email || "Usuário sem nome";
}

export async function getEquipeEvento(eventoId: number) {
  await assertAccess("eventos");
  try {
    const directus = await getDirectusClient({ requireAuth: true });
    const equipe = await directus.request(
      readItems("equipe_evento", {
        filter: { evento: { _eq: eventoId } },
        fields: [
          "id",
          "usuario.id",
          "usuario.first_name",
          "usuario.last_name",
          "usuario.email",
        ],
        sort: ["usuario.first_name"],
        limit: -1,
      }),
    );
    return { success: true, data: equipe as unknown as MembroEquipe[] };
  } catch (error) {
    console.error("Erro ao buscar equipe do evento:", error);
    return { success: false, error: "Falha ao carregar a equipe." };
  }
}

/**
 * Usuários disponíveis para compor a equipe.
 *
 * Lista TODAS as contas, sem filtrar por status — decisão de produto: contas
 * com status atípico no Directus ainda correspondem a pessoas que podem ter
 * atuado, e esconder alguém do cadastro é pior do que oferecer uma opção a
 * mais. A policy "App Padrão" já concede leitura de `directus_users`, então
 * isto funciona com o token da própria usuária.
 */
export async function getUsuariosParaEquipe() {
  await assertAccess("eventos");
  try {
    const directus = await getDirectusClient({ requireAuth: true });
    const usuarios = (await directus.request(
      readUsers({
        fields: ["id", "first_name", "last_name", "email"],
        sort: ["first_name", "last_name"],
        limit: -1,
      }),
    )) as Array<{
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
    }>;

    const data: UsuarioParaEquipe[] = usuarios
      .map((u) => ({ id: u.id, nome: nomeDoUsuario(u), email: u.email }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    return { success: false, data: [] as UsuarioParaEquipe[] };
  }
}

export async function registrarMembroEquipe(input: {
  evento: number;
  usuario: string;
}) {
  await assertAccess("eventos");

  const validacao = membroEquipeEventoSchema.safeParse(input);
  if (!validacao.success) {
    const primeiro = validacao.error.issues[0];
    return { success: false, error: primeiro?.message || "Dados inválidos." };
  }
  const dados = validacao.data;

  try {
    const directus = await getDirectusClient({ requireAuth: true });

    // A coleção não tem restrição de unicidade e, pela tela, repetir é fácil.
    const jaExiste = (await directus.request(
      readItems("equipe_evento", {
        filter: {
          evento: { _eq: dados.evento },
          usuario: { _eq: dados.usuario },
        },
        fields: ["id"],
        limit: 1,
      }),
    )) as Array<{ id: number }>;

    if (jaExiste.length > 0) {
      return {
        success: false,
        error: "Esta pessoa já consta na equipe deste evento.",
      };
    }

    const criado = (await directus.request(
      createItem(
        "equipe_evento",
        { evento: dados.evento, usuario: dados.usuario },
        { fields: ["id"] },
      ),
    )) as { id: number };

    // O aviso não pode derrubar a escalação: se falhar, a pessoa continua na
    // equipe e o erro fica no log.
    await avisarEscalado(dados.evento, dados.usuario, criado.id);

    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar membro da equipe:", error);
    return { success: false, error: "Erro ao registrar na equipe." };
  }
}

export async function removerMembroEquipe(id: number) {
  await assertAccess("eventos");
  try {
    const directus = await getDirectusClient({ requireAuth: true });

    // Lê o vínculo antes de apagar: depois não há como saber quem avisar.
    const antes = (await directus.request(
      readItems("equipe_evento", {
        filter: { id: { _eq: id } },
        fields: ["id", "evento", "usuario"],
        limit: 1,
      }),
    )) as Array<{ id: number; evento: number | null; usuario: string | null }>;

    await directus.request(deleteItem("equipe_evento", id));

    const vinculo = antes[0];
    if (vinculo?.usuario && vinculo.evento) {
      await avisarRemocao(id, vinculo.evento, vinculo.usuario);
    }

    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao remover membro da equipe:", error);
    return { success: false, error: "Erro ao remover da equipe." };
  }
}
