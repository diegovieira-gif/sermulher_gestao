"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { beneficiariaSchema, type Beneficiaria } from "./schemas";

/**
 * Busca todas as beneficiárias do Directus
 */
export async function getBeneficiarias() {
  try {
    const beneficiarias = await directus.request(
      readItems("beneficiarias", {
        fields: ["*"],
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
 * Salva uma beneficiária (cria ou atualiza)
 */
export async function saveBeneficiaria(data: unknown) {
  try {
    // Valida os dados com Zod
    const validatedData = beneficiariaSchema.parse(data);

    if (validatedData.id) {
      // Atualiza beneficiária existente
      const { id, ...updateData } = validatedData;
      
      await directus.request(
        updateItem("beneficiarias", id, updateData)
      );

      revalidatePath("/beneficiarias");
      return {
        success: true,
        message: "Beneficiária atualizada com sucesso!",
      };
    } else {
      // Cria nova beneficiária
      const { id, ...createData } = validatedData;
      
      await directus.request(
        createItem("beneficiarias", createData)
      );

      revalidatePath("/beneficiarias");
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

    revalidatePath("/beneficiarias");
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
