"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { atendimentoFormSchema } from "./schemas";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeDate = (value?: string | null) => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const ATENDIMENTO_FIELDS = [
  "id",
  "beneficiaria",
  "origem_id",
  "prioridade_id",
  "status",
  "data_abertura",
  "encaminhamento_rma",
  "encaminhamento_id",
  "tipos_violencia",
  "medida_protetiva",
  "gestante_puerpera",
  "boletim_ocorrencia",
  "necessidades_sociais",
  "necessidades_juridicas",
  "avaliacao_risco",
  // Relacionamentos
  "beneficiaria.id",
  "beneficiaria.nome_completo",
  "beneficiaria.cpf",
  "origem_id.id",
  "origem_id.nome",
  "prioridade_id.id",
  "prioridade_id.nome",
  "prioridade_id.cor",
  "encaminhamento_id.id",
  "encaminhamento_id.nome",
  "encaminhamento_id.grupo_rma",
  // Sintaxe correta para M2M no Directus:
  "tipos_violencia_lista.atendimentos_id",
  "tipos_violencia_lista.config_tipos_agressao_id.id",
  "tipos_violencia_lista.config_tipos_agressao_id.nome",
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

export type EncaminhamentoOption = {
  id: number;
  nome: string;
  grupo_rma?: string;
};

export type TipoViolenciaOption = {
  id: number;
  nome: string;
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
      }),
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
    const [
      beneficiarias,
      origens,
      prioridades,
      encaminhamentos,
      tiposViolencia,
    ] = await Promise.all([
      directus.request(
        readItems("beneficiarias", {
          fields: ["id", "nome_completo", "cpf"],
          sort: ["nome_completo"],
          limit: -1, // CORREÇÃO: Buscar todos os registros para permitir filtro no cliente
        }),
      ) as Promise<BeneficiariaOption[]>,
      directus.request(
        readItems("config_origens", {
          fields: ["id", "nome"],
          sort: ["nome"],
        }),
      ) as Promise<OrigemOption[]>,
      directus.request(
        readItems("config_prioridades", {
          fields: ["id", "nome", "cor"],
          sort: ["nivel"],
        }),
      ) as Promise<PrioridadeOption[]>,
      directus.request(
        readItems("config_encaminhamentos", {
          fields: ["id", "nome", "grupo_rma"],
          sort: ["nome"],
        }),
      ) as Promise<EncaminhamentoOption[]>,
      directus.request(
        readItems("config_tipos_agressao", {
          fields: ["id", "nome"],
          sort: ["nome"],
        }),
      ) as Promise<TipoViolenciaOption[]>,
    ]);

    return {
      success: true,
      data: {
        beneficiarias,
        origens,
        prioridades,
        encaminhamentos,
        tiposViolencia,
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
    const payload: Record<string, unknown> = {
      beneficiaria: validatedData.beneficiaria,
      status: validatedData.status,
      data_abertura:
        normalizeDate(validatedData.data_abertura) ||
        new Date().toISOString().split("T")[0],
      medida_protetiva: validatedData.medida_protetiva,
      gestante_puerpera: validatedData.gestante_puerpera,
      boletim_ocorrencia: validatedData.boletim_ocorrencia,
      necessidades_sociais: validatedData.necessidades_sociais,
      necessidades_juridicas: validatedData.necessidades_juridicas,
      avaliacao_risco: validatedData.avaliacao_risco,
    };

    // Campos opcionais
    if (validatedData.origem_id) {
      payload.origem_id = validatedData.origem_id;
      // Snapshot do nome da origem
      try {
        const origem = await directus.request(
          readItems("config_origens", {
            fields: ["nome"],
            filter: { id: { _eq: validatedData.origem_id } },
            limit: 1,
          }),
        );
        if (origem?.[0]?.nome) {
          payload.origem = origem[0].nome;
        }
      } catch (e) {
        console.error("Erro ao buscar nome da origem", e);
      }
    }

    if (validatedData.prioridade_id) {
      payload.prioridade_id = validatedData.prioridade_id;
      // Snapshot do nome da prioridade
      try {
        const prioridade = await directus.request(
          readItems("config_prioridades", {
            fields: ["nome"],
            filter: { id: { _eq: validatedData.prioridade_id } },
            limit: 1,
          }),
        );
        if (prioridade?.[0]?.nome) {
          payload.prioridade = prioridade[0].nome;
        }
      } catch (e) {
        console.error("Erro ao buscar nome da prioridade", e);
      }
    }

    if (validatedData.encaminhamento_id) {
      payload.encaminhamento_id = validatedData.encaminhamento_id;

      try {
        const enc = await directus.request(
          readItems("config_encaminhamentos", {
            fields: ["nome"],
            filter: { id: { _eq: validatedData.encaminhamento_id } },
            limit: 1,
          }),
        );
        const encNome = enc?.[0]?.nome;
        if (encNome) {
          payload.encaminhamento_rma = slugify(String(encNome));
        }
      } catch {
        // mantém compatibilidade mesmo se não achar o nome
      }
    }
    if (
      validatedData.tipos_violencia &&
      Array.isArray(validatedData.tipos_violencia)
    ) {
      // Para M2M no Directus, precisamos passar objetos com a FK da related collection
      payload.tipos_violencia_lista = validatedData.tipos_violencia.map(
        (id) => ({
          config_tipos_agressao_id: id,
        }),
      );

      try {
        const violencias = await directus.request(
          readItems("config_tipos_agressao", {
            fields: ["nome"],
            filter: { id: { _in: validatedData.tipos_violencia } },
          }),
        );
        const nomes = Array.isArray(violencias)
          ? violencias.map((item: any) => item?.nome).filter(Boolean)
          : [];
        if (nomes.length) {
          payload.tipos_violencia = nomes.join(",");
        }
      } catch {
        // se falhar, não bloqueia a gravação
      }
    }

    if (validatedData.id) {
      // Atualiza atendimento existente
      await directus.request(
        updateItem("atendimentos", validatedData.id, payload),
      );

      revalidatePath("/mulheres/atendimentos");
      return {
        success: true,
        message: "Atendimento atualizado com sucesso!",
      };
    } else {
      // Cria novo atendimento
      await directus.request(createItem("atendimentos", payload));

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
