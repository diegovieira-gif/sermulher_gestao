"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, readItem, createItem } from "@directus/sdk";
import { z } from "zod";
import { tramitacaoSchema } from "./schemas";

export type TramitacaoInput = z.infer<typeof tramitacaoSchema>;

export type SetorOption = {
  id: number;
  nome: string;
};

export type TramitacaoWithRelations = {
  id: number;
  tipo_demanda: string | null;
  status_etapa: string | null;
  relato_tecnico: string | null;
  data_recebimento: string | null;
  setor_responsavel: {
    id: number;
    nome: string;
  } | null;
  usuario_responsavel: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export type AtendimentoDetails = {
  id: number;
  status: string | null;
  data_abertura: string | null;
  beneficiaria: {
    id: number;
    nome_completo: string;
    cpf: string | null;
    data_nascimento: string | null;
    contato: any;
    endereco: any;
  } | null;
  origem_id: {
    id: number;
    nome: string;
  } | null;
  prioridade_id: {
    id: number;
    nome: string;
    cor: string | null;
  } | null;
};

/**
 * Busca detalhes completos do atendimento incluindo beneficiária com dados profundos
 */
export async function getAtendimentoDetails(
  id: string | number
): Promise<
  | { success: true; data: AtendimentoDetails }
  | { success: false; error: string }
> {
  try {
    const atendimento = await directus.request(
      readItem("atendimentos", Number(id), {
        fields: [
          "id",
          "status",
          "data_abertura",
          "beneficiaria.id",
          "beneficiaria.nome_completo",
          "beneficiaria.cpf",
          "beneficiaria.data_nascimento",
          "beneficiaria.contato",
          "beneficiaria.endereco",
          "origem_id.id",
          "origem_id.nome",
          "prioridade_id.id",
          "prioridade_id.nome",
          "prioridade_id.cor",
        ],
      })
    );

    return { success: true, data: atendimento as AtendimentoDetails };
  } catch (error) {
    console.error("Erro ao buscar detalhes do atendimento:", error);
    return {
      success: false,
      error: "Erro ao buscar detalhes do atendimento. Tente novamente.",
    };
  }
}

/**
 * Busca todas as tramitações de um atendimento, ordenadas por data_recebimento (desc)
 */
export async function getTramitacoes(
  atendimentoId: string | number
): Promise<
  | { success: true; data: TramitacaoWithRelations[] }
  | { success: false; error: string }
> {
  try {
    const tramitacoes = await directus.request(
      readItems("tramitacoes", {
        fields: [
          "id",
          "tipo_demanda",
          "status_etapa",
          "relato_tecnico",
          "data_recebimento",
          "setor_responsavel.id",
          "setor_responsavel.nome",
          "usuario_responsavel.id",
          "usuario_responsavel.first_name",
          "usuario_responsavel.last_name",
        ],
        filter: {
          atendimento_pai: {
            _eq: Number(atendimentoId),
          },
        },
        sort: ["-data_recebimento"],
      })
    );

    return { success: true, data: tramitacoes as TramitacaoWithRelations[] };
  } catch (error) {
    console.error("Erro ao buscar tramitações:", error);
    return {
      success: false,
      error: "Erro ao buscar tramitações. Tente novamente.",
    };
  }
}

/**
 * Salva uma nova tramitação vinculada a um atendimento
 */
export async function saveTramitacao(
  data: unknown
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    // Valida os dados com Zod
    const validatedData = tramitacaoSchema.parse(data);

    // Prepara o payload para o Directus
    const payload: any = {
      atendimento_pai: validatedData.atendimento_pai,
      tipo_demanda: validatedData.tipo_demanda,
      relato_tecnico: validatedData.relato_tecnico,
      data_recebimento: validatedData.data_recebimento || new Date().toISOString(),
    };

    // Campos opcionais
    if (validatedData.setor_responsavel) {
      payload.setor_responsavel = validatedData.setor_responsavel;
    }

    if (validatedData.status_etapa) {
      payload.status_etapa = validatedData.status_etapa;
    }

    // TODO: Associar usuario_responsavel ao usuário atual logado
    // Por enquanto, deixamos null e pode ser preenchido manualmente no Directus
    // Se necessário, podemos buscar o usuário atual via autenticação

    // Cria nova tramitação
    await directus.request(createItem("tramitacoes", payload));

    // Revalida o cache da página
    revalidatePath(`/mulheres/atendimentos/${validatedData.atendimento_pai}`);

    return {
      success: true,
      message: "Tramitação registrada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao salvar tramitação:", error);

    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Dados inválidos. Verifique os campos.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar tramitação. Tente novamente.",
    };
  }
}

/**
 * Busca lista de setores para o dropdown
 */
export async function getSetores(): Promise<
  | { success: true; data: SetorOption[] }
  | { success: false; error: string }
> {
  try {
    const setores = await directus.request(
      readItems("setores", {
        fields: ["id", "nome"],
        sort: ["nome"],
      })
    );

    return { success: true, data: setores as SetorOption[] };
  } catch (error) {
    console.error("Erro ao buscar setores:", error);
    return {
      success: false,
      error: "Erro ao buscar setores. Tente novamente.",
    };
  }
}