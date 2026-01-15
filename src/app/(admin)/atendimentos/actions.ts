"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { createItem, readItems, updateItem } from "@directus/sdk";
import { insertAtendimentoSchema, upsertAtendimentoSchema } from "./schemas";

type BeneficiariaOption = { id: number; nome_completo: string };

/**
 * Busca atendimentos (inclui dados da beneficiária para exibir nome)
 */
export async function getAtendimentos() {
  try {
    const atendimentos = await directus.request(
      readItems("atendimentos", {
        fields: ["*", "beneficiaria.id", "beneficiaria.nome_completo"],
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

