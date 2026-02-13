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
  // Campos de texto simples (Legado/Snapshot)
  origem: string | null;
  prioridade: string | null;
  beneficiaria: {
    id: number;
    nome_completo: string;
    cpf: string | null;
    data_nascimento: string | null;
    telefone: string | null;
    contato: any;
    endereco: any;
  } | null;
  tipo_violencia: {
    nome: string;
  } | null;
  // Campos relacionais
  prioridade_id: {
    nome: string;
  } | null;
  origem_id: {
    nome: string;
  } | null;
  relato_atendimento: string | null;
  demanda_juridica: boolean;
  demanda_psicologica: boolean;
  demanda_socioassistencial: boolean;
  sigiloso: boolean;
  // Novos campos estruturados
  medida_protetiva: boolean;
  gestante_puerpera: boolean;
  boletim_ocorrencia: string | null;
  necessidades_sociais: any;
  necessidades_juridicas: any;
  avaliacao_risco: any;
  tipos_violencia: string | null; // Pode vir como string csv ou objeto via relacionamento
  tipos_violencia_lista: any[]; // Relacionamento M2M
};

/**
 * Busca detalhes completos de um atendimento
 */
export async function getAtendimentoDetails(id: number) {
  try {
    const atendimento = await directus.request(
      readItem("atendimentos", id, {
        fields: [
          "*", // Traz 'origem' e 'prioridade' (strings)
          {
            beneficiaria: [
              "id",
              "nome_completo",
              "cpf",
              "data_nascimento",
              "telefone",
              "contato",
              "endereco",
            ],
          },
          {
            tipo_violencia: ["nome"],
          },
          {
            prioridade_id: ["nome"],
          },
          {
            origem_id: ["nome"],
          },
          {
            tipos_violencia_lista: [
              {
                config_tipos_agressao_id: ["nome"],
              },
            ],
          },
        ],
      }),
    );

    return { success: true, data: atendimento as AtendimentoDetails };
  } catch (error) {
    console.error("Erro ao buscar atendimento:", error);
    return { success: false, error: "Atendimento não encontrado." };
  }
}

/**
 * Busca o histórico de tramitações
 */
export async function getTramitacoes(atendimentoId: number) {
  try {
    const tramitacoes = await directus.request(
      readItems("tramitacoes", {
        filter: {
          atendimento_pai: {
            _eq: atendimentoId,
          },
        },
        sort: ["-data_recebimento"],
        fields: [
          "id",
          "tipo_demanda",
          "status_etapa",
          "relato_tecnico",
          "data_recebimento",
          {
            setor_responsavel: ["id", "nome"],
          },
          {
            usuario_responsavel: ["id", "first_name", "last_name"],
          },
        ],
      }),
    );

    return {
      success: true,
      data: tramitacoes as unknown as TramitacaoWithRelations[],
    };
  } catch (error) {
    console.error("Erro ao buscar tramitações:", error);
    return { success: false, error: "Erro ao carregar histórico." };
  }
}

/**
 * Salva uma nova tramitação
 */
export async function saveTramitacao(data: unknown) {
  try {
    const validatedData = tramitacaoSchema.parse(data);

    const payload = {
      ...validatedData,
      usuario_responsavel: null,
    };

    await directus.request(createItem("tramitacoes", payload));

    revalidatePath(`/mulheres/atendimentos/${validatedData.atendimento_pai}`);

    return {
      success: true,
      message: "Tramitação registrada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao salvar tramitação:", error);

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
  { success: true; data: SetorOption[] } | { success: false; error: string }
> {
  try {
    const setores = await directus.request(
      readItems("setores", {
        fields: ["id", "nome"],
        sort: ["nome"],
      }),
    );
    return { success: true, data: setores as SetorOption[] };
  } catch (error) {
    return { success: false, error: "Erro ao buscar setores" };
  }
}
