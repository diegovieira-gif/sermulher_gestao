"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import {
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
} from "@directus/sdk";
import {
  addParticipanteSchema,
  updateParticipacaoSchema,
  sessaoSchema,
  type AddParticipanteData,
  type UpdateParticipacaoData,
  type SessaoData,
} from "./schemas";
import { assertAccess } from "@/lib/permissions";
import { frequenciasPorParticipacao, type FrequenciaCalculada } from "@/lib/frequencia";
import { booleano } from "@/lib/datas";

/**
 * Frequência de cada participação do ciclo, calculada pela lista de presença
 * (mesma conta do relatório ao Judiciário).
 */
async function calcularFrequencias(
  salaId: number,
  participacaoIds: number[]
): Promise<Map<number, FrequenciaCalculada>> {
  if (participacaoIds.length === 0) return new Map();
  const sessoes = await directus.request(
    readItems("ciclo_sessoes", {
      fields: ["id"],
      filter: { sala_id: { _eq: salaId } },
      limit: -1,
    })
  );
  const sessaoIds = sessoes.map((s) => Number(s.id));
  const registros = sessaoIds.length
    ? await directus.request(
        readItems("sessoes_presenca", {
          fields: ["sessao_id", "participacao_id", "presente"],
          filter: {
            sessao_id: { _in: sessaoIds },
            participacao_id: { _in: participacaoIds },
          },
          limit: -1,
        })
      )
    : [];
  return frequenciasPorParticipacao(sessaoIds, registros, participacaoIds);
}

/**
 * Grava em `frequencia_percentual` a frequência calculada de cada participação
 * do ciclo. Roda depois de toda mudança em chamada ou sessão, para a lista do
 * ciclo e o histórico do infrator nunca divergirem do relatório.
 */
async function sincronizarFrequencias(salaId: number): Promise<void> {
  const participacoes = await directus.request(
    readItems("participacoes_sala_azul", {
      fields: ["id", "frequencia_percentual"],
      filter: { sala: { _eq: salaId } },
      limit: -1,
    })
  );
  const ids = participacoes.map((p) => Number(p.id));
  const calculadas = await calcularFrequencias(salaId, ids);
  for (const p of participacoes) {
    const percentual = calculadas.get(Number(p.id))?.percentual ?? 0;
    if (p.frequencia_percentual !== percentual) {
      await directus.request(
        updateItem("participacoes_sala_azul", p.id, { frequencia_percentual: percentual })
      );
    }
  }
}

/** Sincroniza sem derrubar a operação principal: a tela recalcula ao ler. */
async function sincronizarFrequenciasSemFalhar(salaId: number): Promise<void> {
  try {
    await sincronizarFrequencias(salaId);
  } catch (error) {
    console.error("Erro ao sincronizar frequências do ciclo:", error);
  }
}

/**
 * Busca detalhes da sala e lista de participantes
 */
export async function getSalaDetails(id: string | number) {
  await assertAccess("sala-azul");
  try {
    const salaId = typeof id === "string" ? parseInt(id, 10) : id;

    if (isNaN(salaId)) {
      return {
        success: false,
        error: "ID da sala inválido",
      };
    }

    // Busca dados da sala com relacionamentos
    const sala = await directus.request(
      readItem("salas_azul", salaId, {
        fields: [
          "*",
          "local_id.id",
          "local_id.nome",
          "responsavel_tecnico.id",
          "responsavel_tecnico.first_name",
          "responsavel_tecnico.last_name",
        ],
      })
    );

    // Busca participantes da sala com dados profundos do infrator
    const participacoes = await directus.request(
      readItems("participacoes_sala_azul", {
        fields: [
          "*", // Dados da participação (presenças, status no ciclo)
          "infrator.id",
          "infrator.nome_completo",
          "infrator.cpf",
          "infrator.contato", // Campo JSON com telefone: { telefone: "..." }
          // Busca Nível e Status para mostrar alertas na turma
          "infrator.nivel_id.nome",
          "infrator.nivel_id.cor",
          "infrator.status_legal_id.nome",
        ],
        filter: {
          sala: {
            _eq: salaId,
          },
        },
        sort: ["infrator.nome_completo"],
        // Sem limite explícito o Directus corta em 100 itens.
        limit: -1,
      })
    );

    // A frequência exibida é sempre a calculada pela lista de presença,
    // mesmo para participações antigas cuja frequência foi digitada à mão.
    const frequencias = await calcularFrequencias(
      salaId,
      participacoes.map((p) => Number(p.id))
    );
    const participacoesComFrequencia = participacoes.map((p) => {
      const f = frequencias.get(Number(p.id));
      return {
        ...p,
        frequencia_percentual: f?.percentual ?? 0,
        total_sessoes: f?.totalSessoes ?? 0,
        presencas: f?.presencas ?? 0,
      };
    });

    return {
      success: true,
      data: {
        sala,
        participacoes: participacoesComFrequencia,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes da sala:", error);
    return {
      success: false,
      error: "Erro ao buscar dados da sala. Tente novamente.",
    };
  }
}

/**
 * Busca todos os infratores disponíveis (para adicionar à turma)
 */
export async function getInfratoresDisponiveis(salaId: number) {
  await assertAccess("sala-azul");
  try {
    // Primeiro, busca IDs dos infratores que já estão na sala
    const participacoesExistentes = await directus.request(
      readItems("participacoes_sala_azul", {
        fields: ["infrator"],
        filter: {
          sala: {
            _eq: salaId,
          },
        },
        limit: -1,
      })
    );

    const idsJaParticipando = participacoesExistentes.map((p: any) => p.infrator);

    // Busca todos os infratores, excluindo os que já estão na sala
    const filter: any = {};
    if (idsJaParticipando.length > 0) {
      filter.id = {
        _nin: idsJaParticipando,
      };
    }

    const infratores = await directus.request(
      readItems("infratores", {
        fields: [
          "id",
          "nome_completo",
          "cpf",
          "nivel_id.id",
          "nivel_id.nome",
          "nivel_id.cor",
          "status_legal_id.id",
          "status_legal_id.nome",
        ],
        filter,
        sort: ["nome_completo"],
        // Sem limite explícito o Directus corta em 100: infratores além do
        // centésimo nunca apareciam para inclusão no ciclo.
        limit: -1,
      })
    );

    return {
      success: true,
      data: infratores || [],
    };
  } catch (error) {
    console.error("Erro ao buscar infratores disponíveis:", error);
    return {
      success: false,
      error: "Erro ao buscar autores. Tente novamente.",
      data: [],
    };
  }
}

/**
 * Adiciona um participante à sala
 */
export async function addParticipante(data: unknown) {
  await assertAccess("sala-azul");
  try {
    // Valida os dados com Zod
    const validatedData = addParticipanteSchema.parse(data);

    // Verifica se o infrator já está na sala
    const participacaoExistente = await directus.request(
      readItems("participacoes_sala_azul", {
        fields: ["id"],
        filter: {
          infrator: {
            _eq: validatedData.infrator,
          },
          sala: {
            _eq: validatedData.sala,
          },
        },
        limit: 1,
      })
    );

    if (participacaoExistente && participacaoExistente.length > 0) {
      return {
        success: false,
        error: "Este autor já está participando desta turma.",
      };
    }

    // Cria a participação
    await directus.request(
      createItem("participacoes_sala_azul", {
        infrator: validatedData.infrator,
        sala: validatedData.sala,
        status_participacao: validatedData.status_participacao,
        frequencia_percentual: 0,
      })
    );

    revalidatePath(`/sala-azul/ciclos/${validatedData.sala}`);
    return {
      success: true,
      message: "Participante adicionado à turma com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao adicionar participante:", error);

    // Erro de validação do Zod
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao adicionar participante. Tente novamente.",
    };
  }
}

/**
 * Atualiza dados de uma participação
 */
export async function updateParticipante(
  participacaoId: number,
  data: unknown
) {
  await assertAccess("sala-azul");
  try {
    // Valida os dados com Zod
    const validatedData = updateParticipacaoSchema.parse(data);

    // Busca a participação para obter o ID da sala
    const participacao = await directus.request(
      readItem("participacoes_sala_azul", participacaoId, {
        fields: ["sala"],
      })
    );

    // A frequência não vem do formulário: é a da lista de presença.
    const salaId = Number(participacao.sala);
    const frequencia = (await calcularFrequencias(salaId, [participacaoId])).get(
      participacaoId
    );

    await directus.request(
      updateItem("participacoes_sala_azul", participacaoId, {
        ...validatedData,
        frequencia_percentual: frequencia?.percentual ?? 0,
      })
    );

    revalidatePath(`/sala-azul/ciclos/${participacao.sala}`);
    return {
      success: true,
      message: "Participação atualizada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao atualizar participação:", error);

    // Erro de validação do Zod
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao atualizar participação. Tente novamente.",
    };
  }
}

/**
 * Remove um participante da sala
 */
export async function removeParticipante(participacaoId: number) {
  await assertAccess("sala-azul");
  try {
    // Busca a participação para obter o ID da sala antes de deletar
    const participacao = await directus.request(
      readItem("participacoes_sala_azul", participacaoId, {
        fields: ["sala"],
      })
    );

    await directus.request(deleteItem("participacoes_sala_azul", participacaoId));

    revalidatePath(`/sala-azul/ciclos/${participacao.sala}`);
    return {
      success: true,
      message: "Participante removido da turma com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao remover participante:", error);
    return {
      success: false,
      error: "Erro ao remover participante. Tente novamente.",
    };
  }
}

/**
 * Busca todas as sessões de uma sala ordenadas por data (desc)
 */
export async function getSessoes(salaId: number) {
  await assertAccess("sala-azul");
  try {
    const sessoes = await directus.request(
      readItems("ciclo_sessoes", {
        fields: ["*"],
        filter: {
          sala_id: {
            _eq: salaId,
          },
        },
        sort: ["-data"],
        limit: -1,
      })
    );

    return {
      success: true,
      data: sessoes || [],
    };
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return {
      success: false,
      error: "Erro ao buscar sessões. Tente novamente.",
      data: [],
    };
  }
}

/**
 * Salva uma sessão (cria ou atualiza)
 */
export async function saveSessao(data: unknown) {
  await assertAccess("sala-azul");
  try {
    // Valida os dados com Zod
    const validatedData = sessaoSchema.parse(data);

    // Prepara os dados para o Directus
    const directusData: any = {
      data: validatedData.data,
      tema: validatedData.tema,
      relatorio: validatedData.relatorio || null,
      sala_id: validatedData.sala_id,
    };

    if (validatedData.id) {
      // Atualiza sessão existente
      await directus.request(
        updateItem("ciclo_sessoes", validatedData.id, directusData)
      );

      await sincronizarFrequenciasSemFalhar(validatedData.sala_id);
      revalidatePath(`/sala-azul/ciclos/${validatedData.sala_id}`);
      return {
        success: true,
        message: "Sessão atualizada com sucesso!",
      };
    } else {
      // Cria nova sessão
      await directus.request(createItem("ciclo_sessoes", directusData));

      await sincronizarFrequenciasSemFalhar(validatedData.sala_id);
      revalidatePath(`/sala-azul/ciclos/${validatedData.sala_id}`);
      return {
        success: true,
        message: "Sessão cadastrada com sucesso!",
      };
    }
  } catch (error) {
    console.error("Erro ao salvar sessão:", error);

    // Erro de validação do Zod
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar sessão. Tente novamente.",
    };
  }
}

/**
 * Deleta uma sessão
 */
export async function deleteSessao(id: number) {
  await assertAccess("sala-azul");
  try {
    // Busca a sessão para obter o ID da sala antes de deletar
    const sessao = await directus.request(
      readItem("ciclo_sessoes", id, {
        fields: ["sala_id"],
      })
    );

    await directus.request(deleteItem("ciclo_sessoes", id));
    await sincronizarFrequenciasSemFalhar(Number(sessao.sala_id));

    revalidatePath(`/sala-azul/ciclos/${sessao.sala_id}`);
    return {
      success: true,
      message: "Sessão excluída com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir sessão:", error);
    return {
      success: false,
      error: "Erro ao excluir sessão. Tente novamente.",
    };
  }
}

/**
 * Busca a lista de chamada (presença) para uma sessão
 */
export async function getChamada(sessaoId: number, cicloId: number) {
  await assertAccess("sala-azul");
  try {
    // Busca todos os participantes do ciclo
    const participacoes = await directus.request(
      readItems("participacoes_sala_azul", {
        fields: [
          "id",
          "infrator.id",
          "infrator.nome_completo",
        ],
        filter: {
          sala: {
            _eq: cicloId,
          },
        },
        sort: ["infrator.nome_completo"],
        limit: -1,
      })
    );

    // Busca os registros de presença existentes para esta sessão
    const presencasExistentes = await directus.request(
      readItems("sessoes_presenca", {
        fields: ["participacao_id", "presente"],
        filter: {
          sessao_id: {
            _eq: sessaoId,
          },
        },
        limit: -1,
      })
    );

    // Cria um mapa para acesso rápido: participacao_id -> presente
    const presencaMap = new Map<number, boolean>();
    presencasExistentes.forEach((p: any) => {
      // O SQLite devolve 1/0: `=== true` mostrava todo mundo como ausente.
      presencaMap.set(Number(p.participacao_id), booleano(p.presente));
    });

    // Mescla os dados: cada participante com sua flag de presença
    const chamada = participacoes.map((participacao: any) => ({
      participacao_id: participacao.id,
      infrator: {
        id: participacao.infrator?.id,
        nome_completo: participacao.infrator?.nome_completo || "-",
      },
      presente: presencaMap.get(participacao.id) || false,
    }));

    return {
      success: true,
      data: chamada,
    };
  } catch (error) {
    console.error("Erro ao buscar chamada:", error);
    return {
      success: false,
      error: "Erro ao buscar lista de presença. Tente novamente.",
      data: [],
    };
  }
}

/**
 * Salva a lista de chamada (presença) para uma sessão
 */
export async function saveChamada(
  sessaoId: number,
  presencas: Array<{ participacao_id: number; presente: boolean }>
) {
  await assertAccess("sala-azul");
  try {
    if (!Array.isArray(presencas)) {
      return {
        success: false,
        error: "Dados inválidos. Formato incorreto.",
      };
    }

    // Busca a sessão para obter o ID da sala (para revalidar o path)
    const sessao = await directus.request(
      readItem("ciclo_sessoes", sessaoId, {
        fields: ["sala_id"],
      })
    );

    // Para cada registro de presença, atualiza ou cria
    for (const presenca of presencas) {
      // Verifica se já existe um registro para esta sessão e participação
      const registrosExistentes = await directus.request(
        readItems("sessoes_presenca", {
          fields: ["id"],
          filter: {
            sessao_id: {
              _eq: sessaoId,
            },
            participacao_id: {
              _eq: presenca.participacao_id,
            },
          },
          limit: 1,
        })
      );

      if (registrosExistentes && registrosExistentes.length > 0) {
        // Atualiza registro existente
        await directus.request(
          updateItem("sessoes_presenca", registrosExistentes[0].id, {
            presente: presenca.presente,
          })
        );
      } else {
        // Cria novo registro
        await directus.request(
          createItem("sessoes_presenca", {
            sessao_id: sessaoId,
            participacao_id: presenca.participacao_id,
            presente: presenca.presente,
          })
        );
      }
    }

    await sincronizarFrequenciasSemFalhar(Number(sessao.sala_id));
    revalidatePath(`/sala-azul/ciclos/${sessao.sala_id}`);
    return {
      success: true,
      message: "Lista de presença salva com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao salvar chamada:", error);
    return {
      success: false,
      error: "Erro ao salvar lista de presença. Tente novamente.",
    };
  }
}
