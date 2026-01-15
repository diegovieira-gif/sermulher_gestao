"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { createItem, readItems, updateItem } from "@directus/sdk";
import { insertAtendimentoSchema, upsertAtendimentoSchema } from "./schemas";

type BeneficiariaOption = { id: number; nome_completo: string };
type OrigemOption = { id: number; nome: string };
type PrioridadeOption = { id: number; nome: string; cor?: string };

/**
 * Busca atendimentos (inclui dados da beneficiária, origem e prioridade para exibir)
 */
export async function getAtendimentos() {
  try {
    const atendimentos = await directus.request(
      readItems("atendimentos", {
        fields: [
          "*",
          "beneficiaria.nome_completo",
          "beneficiaria.id",
          "origem_id.nome",
          "origem_id.id",
          "prioridade_id.nome",
          "prioridade_id.cor",
          "prioridade_id.id",
        ],
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
 * Options leves para preencher o Select de beneficiárias
 */
export async function getBeneficiariasOptions(): Promise<
  | { success: true; data: BeneficiariaOption[] }
  | { success: false; error: string }
> {
  try {
    const beneficiarias = (await directus.request(
      readItems("beneficiarias", {
        fields: ["id", "nome_completo"],
        sort: ["nome_completo"],
      })
    )) as BeneficiariaOption[];

    return { success: true, data: beneficiarias };
  } catch (error) {
    console.error("Erro ao buscar beneficiárias (options):", error);
    return {
      success: false,
      error: "Erro ao buscar beneficiárias. Tente novamente.",
    };
  }
}

/**
 * Busca opções de origens e prioridades do banco de dados
 */
export async function getOptions(): Promise<
  | {
      success: true;
      data: {
        origens: OrigemOption[];
        prioridades: PrioridadeOption[];
      };
    }
  | { success: false; error: string }
> {
  try {
    const [origens, prioridades] = await Promise.all([
      directus.request(
        readItems("config_origens", {
          fields: ["id", "nome"],
          filter: { status: { _eq: "ativo" } },
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
        origens,
        prioridades,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar opções (origens/prioridades):", error);
    return {
      success: false,
      error: "Erro ao buscar opções. Tente novamente.",
    };
  }
}

/**
 * Cria ou atualiza um atendimento
 */
export async function saveAtendimento(data: unknown) {
  try {
    const hasId =
      typeof data === "object" &&
      data !== null &&
      "id" in data &&
      Boolean((data as { id?: unknown }).id);

    if (hasId) {
      const validatedData = upsertAtendimentoSchema.parse(data);
      const { id, ...payload } = validatedData;
      if (typeof id !== "string" && typeof id !== "number") {
        throw new Error("ID inválido para atualização do atendimento");
      }
      await directus.request(updateItem("atendimentos", id, payload));
      revalidatePath("/atendimentos");
      return { success: true, message: "Atendimento atualizado com sucesso!" };
    }

    const validatedData = insertAtendimentoSchema.parse(data);
    const payload = validatedData;
    await directus.request(createItem("atendimentos", payload));
    revalidatePath("/atendimentos");
    return { success: true, message: "Atendimento criado com sucesso!" };
  } catch (error) {
    console.error("Erro ao salvar atendimento:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return { success: false, error: "Erro ao salvar atendimento. Tente novamente." };
  }
}

/**
 * Atualiza apenas o status de um atendimento
 */
export async function updateStatus(
  id: number | string,
  status: string
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  try {
    await directus.request(
      updateItem("atendimentos", id, {
        status,
      })
    );
    revalidatePath("/atendimentos");
    return { success: true, message: "Status atualizado com sucesso!" };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return {
      success: false,
      error: "Erro ao atualizar status. Tente novamente.",
    };
  }
}

