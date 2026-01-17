"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { atendimentoFormSchema } from "./schemas";

const ATENDIMENTO_FIELDS = [
  'id',
  'beneficiaria',
  'origem_id',
  'prioridade_id',
  'status',
  'data_abertura',
  'encaminhamento_rma',
  'tipos_violencia',
  // Relacionamentos
  'beneficiaria.id',
  'beneficiaria.nome_completo',
  'beneficiaria.cpf',
  'origem_id.id',
  'origem_id.nome',
  'prioridade_id.id',
  'prioridade_id.nome',
  'prioridade_id.cor',
];

// Tipos exportados para uso nos componentes
export type BeneficiariaOption = {
  id: number;
  nome_completo: string;
  cpf?: string;
};

export type OrigemOption = {
  id: number;
  nome: string;
};

export type PrioridadeOption = {
  id: number;
  nome: string;
  cor?: string;
};

/**
 * Busca todas as atendimentos com relacionamentos
 */
export async function getAtendimentos() {
  try {
    const atendimentos = await directus.request(
      readItems("atendimentos", {
        fields: ATENDIMENTO_FIELDS,
        sort: ["-data_abertura"],
      })
    );

    return { success: true, data: atendimentos };
  } catch (error) {
    console.error("Erro ao buscar atendimentos:", error);
    return {
      success: false,
      error: "Erro ao buscar atendimentos. Tente novamente.",
    };
  }
}

/**
 * Busca opções para o formulário (beneficiárias, origens, prioridades)
 */
export async function getFormOptions() {
  try {
    const [beneficiarias, origens, prioridades] = await Promise.all([
      directus.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "cpf"],
          sort: ["nome_completo"],
        })
      ) as Promise<BeneficiariaOption[]>,
      directus.request(
        readItems("config_origens", {
          fields: ["id", "nome"],
          sort: ["nome"],
        })
      ) as Promise<OrigemOption[]>,
      directus.request(
        readItems("config_prioridades", {
          fields: ["id", "nome", "cor"],
          sort: ["nivel"],
        })
      ) as Promise<PrioridadeOption[]>,
    ]);

    return {
      success: true,
      data: {
        beneficiarias,
        origens,
        prioridades,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar opções do formulário:", error);
    return {
      success: false,
      error: "Erro ao buscar opções. Tente novamente.",
    };
  }
}

/**
 * Salva um atendimento (cria ou atualiza)
 */
export async function saveAtendimento(data: unknown) {
  try {
    // Valida os dados com Zod
    const validatedData = atendimentoFormSchema.parse(data);

    // Prepara o payload para o Directus
    const payload: any = {
      beneficiaria: validatedData.beneficiaria,
      status: validatedData.status,
      data_abertura: validatedData.data_abertura || new Date().toISOString().split("T")[0],
    };

    // Campos opcionais
    if (validatedData.origem_id) {
      payload.origem_id = validatedData.origem_id;
    }
    if (validatedData.prioridade_id) {
      payload.prioridade_id = validatedData.prioridade_id;
    }
    if (validatedData.encaminhamento_rma) {
      payload.encaminhamento_rma = validatedData.encaminhamento_rma;
    }
    // Converte array de tipos_violencia para CSV
    if (validatedData.tipos_violencia && Array.isArray(validatedData.tipos_violencia)) {
      payload.tipos_violencia = validatedData.tipos_violencia.join(",");
    } else if (typeof validatedData.tipos_violencia === 'string') {
      payload.tipos_violencia = validatedData.tipos_violencia;
    }

    if (validatedData.id) {
      // Atualiza atendimento existente
      await directus.request(
        updateItem("atendimentos", validatedData.id, payload)
      );

      revalidatePath("/mulheres/atendimentos");
      return {
        success: true,
        message: "Atendimento atualizado com sucesso!",
      };
    } else {
      // Cria novo atendimento
      await directus.request(
        createItem("atendimentos", payload)
      );

      revalidatePath("/mulheres/atendimentos");
      return {
        success: true,
        message: "Atendimento criado com sucesso!",
      };
    }
  } catch (error) {
    console.error("Erro ao salvar atendimento:", error);

    // Erro de validação do Zod
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar atendimento. Tente novamente.",
    };
  }
}

/**
 * Deleta um atendimento
 */
export async function deleteAtendimento(id: number) {
  try {
    await directus.request(deleteItem("atendimentos", id));

    revalidatePath("/mulheres/atendimentos");
    return {
      success: true,
      message: "Atendimento excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir atendimento:", error);
    return {
      success: false,
      error: "Erro ao excluir atendimento. Tente novamente.",
    };
  }
}
