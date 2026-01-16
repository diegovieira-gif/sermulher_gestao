"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem, readItem } from "@directus/sdk";
import { beneficiariaSchema, type Beneficiaria } from "./schemas";

const BENEFICIARIA_FIELDS = [
  'id',
  'nome_completo',
  'cpf',
  'data_nascimento',
  'contato',
  'endereco',
  'perfil_socioeconomico',
];

/**
 * Busca todas as beneficiárias do Directus
 */
export async function getBeneficiarias() {
  try {
    const beneficiarias = await directus.request(
      readItems("beneficiarias", {
        fields: BENEFICIARIA_FIELDS,
        sort: ["nome_completo"],
      })
    );

    return { success: true, data: beneficiarias };
  } catch (error) {
    console.error("Erro ao buscar beneficiárias:", error);
    return {
      success: false,
      error: "Erro ao buscar beneficiárias. Tente novamente.",
    };
  }
}

/**
 * Busca uma beneficiária específica por ID
 */
export async function getBeneficiaria(id: number) {
  try {
    const beneficiaria = await directus.request(
      readItem("beneficiarias", id, {
        fields: BENEFICIARIA_FIELDS,
      })
    );

    return { success: true, data: beneficiaria };
  } catch (error) {
    console.error("Erro ao buscar beneficiária:", error);
    return {
      success: false,
      error: "Erro ao buscar beneficiária. Tente novamente.",
    };
  }
}

/**
 * Salva uma beneficiária (cria ou atualiza)
 */
export async function saveBeneficiaria(data: unknown) {
  try {
    // Valida os dados com Zod
    const validatedData = beneficiariaSchema.parse(data);

    // Prepara o payload para o Directus
    const payload: any = {
      nome_completo: validatedData.nome_completo,
      data_nascimento: validatedData.data_nascimento,
      contato: validatedData.contato,
      endereco: validatedData.endereco,
      perfil_socioeconomico: validatedData.perfil_socioeconomico || null,
    };

    // CPF opcional - só inclui se preenchido
    if (validatedData.cpf && validatedData.cpf.trim() !== "") {
      // Remove formatação do CPF antes de salvar
      payload.cpf = validatedData.cpf.replace(/\D/g, "");
    }

    if (validatedData.id) {
      // Atualiza beneficiária existente
      await directus.request(
        updateItem("beneficiarias", validatedData.id, payload)
      );

      revalidatePath("/mulheres/beneficiarias");
      return {
        success: true,
        message: "Beneficiária atualizada com sucesso!",
      };
    } else {
      // Cria nova beneficiária
      await directus.request(
        createItem("beneficiarias", payload)
      );

      revalidatePath("/mulheres/beneficiarias");
      return {
        success: true,
        message: "Beneficiária cadastrada com sucesso!",
      };
    }
  } catch (error) {
    console.error("Erro ao salvar beneficiária:", error);

    // Erro de validação do Zod
    if (error instanceof Error && error.name === "ZodError") {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar beneficiária. Tente novamente.",
    };
  }
}

/**
 * Deleta uma beneficiária
 */
export async function deleteBeneficiaria(id: number) {
  try {
    await directus.request(deleteItem("beneficiarias", id));

    revalidatePath("/mulheres/beneficiarias");
    return {
      success: true,
      message: "Beneficiária excluída com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir beneficiária:", error);
    return {
      success: false,
      error: "Erro ao excluir beneficiária. Tente novamente.",
    };
  }
}
