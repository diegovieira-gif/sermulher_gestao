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
  type AddParticipanteData,
  type UpdateParticipacaoData,
} from "./schemas";

/**
 * Busca detalhes da sala e lista de participantes
 */
export async function getSalaDetails(id: string | number) {
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
          "infrator.contato", // Para exibir telefone se necessário
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
      })
    );

    return {
      success: true,
      data: {
        sala,
        participacoes,
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
      error: "Erro ao buscar infratores. Tente novamente.",
      data: [],
    };
  }
}

/**
 * Adiciona um participante à sala
 */
export async function addParticipante(data: unknown) {
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
        error: "Este infrator já está participando desta turma.",
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
  try {
    // Valida os dados com Zod
    const validatedData = updateParticipacaoSchema.parse(data);

    // Busca a participação para obter o ID da sala
    const participacao = await directus.request(
      readItem("participacoes_sala_azul", participacaoId, {
        fields: ["sala"],
      })
    );

    await directus.request(
      updateItem("participacoes_sala_azul", participacaoId, validatedData)
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
