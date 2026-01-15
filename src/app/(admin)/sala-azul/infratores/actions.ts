"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { insertInfratorSchema, type Infrator } from "./schemas";

/**
 * Busca todos os infratores do Directus
 */
export async function getInfratores() {
  try {
    const infratores = await directus.request(
      readItems("infratores", {
        fields: ["*"],
        sort: ["nome_completo"],
      })
    );

    return { success: true, data: infratores };
  } catch (error) {
    console.error("Erro ao buscar infratores:", error);
    return {
      success: false,
      error: "Erro ao buscar infratores. Tente novamente.",
    };
  }
}

/**
 * Salva um infrator (cria ou atualiza)
 */
export async function saveInfrator(data: unknown) {
  try {
    // Valida os dados com Zod
    const validatedData = insertInfratorSchema.parse(data);

    // Prepara os dados para o Directus
    // Se tipo_agressao for array, convertemos para string CSV se necessário
    const directusData: any = {
      nome_completo: validatedData.nome_completo,
      cpf: validatedData.cpf,
      nivel_periculosidade: validatedData.nivel_periculosidade,
      status_legal: validatedData.status_legal,
    };

    // Trata tipo_agressao: se for array, mantém como array (Directus pode aceitar JSON)
    // Se o Directus esperar CSV, converta aqui: validatedData.tipo_agressao.join(',')
    directusData.tipo_agressao = validatedData.tipo_agressao;

    if (validatedData.id) {
      // Atualiza infrator existente
      await directus.request(
        updateItem("infratores", validatedData.id, directusData)
      );

      revalidatePath("/sala-azul/infratores");
      return {
        success: true,
        message: "Infrator atualizado com sucesso!",
      };
    } else {
      // Cria novo infrator
      await directus.request(createItem("infratores", directusData));

      revalidatePath("/sala-azul/infratores");
      return {
        success: true,
        message: "Infrator cadastrado com sucesso!",
      };
    }
  } catch (error) {
    console.error("Erro ao salvar infrator:", error);

    // Erro de validação do Zod
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar infrator. Tente novamente.",
    };
  }
}

/**
 * Deleta um infrator
 */
export async function deleteInfrator(id: number) {
  try {
    await directus.request(deleteItem("infratores", id));

    revalidatePath("/sala-azul/infratores");
    return {
      success: true,
      message: "Infrator excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir infrator:", error);
    return {
      success: false,
      error: "Erro ao excluir infrator. Tente novamente.",
    };
  }
}
