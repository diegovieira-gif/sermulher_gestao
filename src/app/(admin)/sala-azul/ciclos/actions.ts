"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import {
  readItems,
  createItem,
  updateItem,
  deleteItem,
} from "@directus/sdk";
import { insertSalaSchema, type Sala } from "./schemas";

/**
 * Busca todas as salas do Directus ordenadas por data_inicio descrescente
 */
export async function getSalas() {
  try {
    const salas = await directus.request(
      readItems("salas_azul", {
        fields: [
          "*",
          "local_id.id",   // ID para o formulário
          "local_id.nome", // NOME para a listagem
          "responsavel_tecnico.first_name",
          "responsavel_tecnico.last_name",
        ],
        sort: ["-data_inicio"],
      })
    );

    return { success: true, data: salas };
  } catch (error) {
    console.error("Erro ao buscar salas:", error);
    return {
      success: false,
      error: "Erro ao buscar salas. Tente novamente.",
    };
  }
}

/**
 * Busca opções para os selects (locais e responsáveis)
 */
export async function getOptions() {
  try {
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || "";
    const directusToken = process.env.DIRECTUS_TOKEN || "";

    const [locais, responsaveisResponse] = await Promise.all([
      // Busca locais
      directus.request(
        readItems("locais", {
          fields: ["id", "nome"],
          sort: ["nome"],
        })
      ),
      // Busca usuários do Directus usando API REST (não pode usar readItems para core collections)
      fetch(`${directusUrl}/users?fields=id,first_name,last_name&sort=first_name,last_name&limit=-1`, {
        headers: {
          Authorization: `Bearer ${directusToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Erro ao buscar usuários: ${res.statusText}`);
          }
          return res.json();
        })
        .catch((error) => {
          console.error("Erro ao buscar usuários:", error);
          return { data: [] };
        }),
    ]);

    // Extrai os dados dos usuários da resposta da API
    // A API do Directus retorna { data: [...] } para collections
    const responsaveis = responsaveisResponse?.data || responsaveisResponse || [];

    return {
      success: true,
      data: {
        locais: locais || [],
        responsaveis: responsaveis || [],
      },
    };
  } catch (error) {
    console.error("Erro ao buscar opções:", error);
    return {
      success: false,
      error: "Erro ao buscar opções. Tente novamente.",
    };
  }
}

/**
 * Salva uma sala (cria ou atualiza)
 */
export async function saveSala(data: unknown) {
  try {
    // Valida os dados com Zod
    const validatedData = insertSalaSchema.parse(data);

    // Prepara os dados para o Directus
    const directusData: any = {
      nome_ciclo: validatedData.nome_ciclo,
      data_inicio: validatedData.data_inicio,
      data_termino: validatedData.data_termino,
      status: validatedData.status,
      local_id: validatedData.local_id,
      responsavel_tecnico: validatedData.responsavel_tecnico,
    };

    if (validatedData.id) {
      // Atualiza sala existente
      await directus.request(
        updateItem("salas_azul", validatedData.id, directusData)
      );

      revalidatePath("/sala-azul/ciclos");
      return {
        success: true,
        message: "Ciclo atualizado com sucesso!",
      };
    } else {
      // Cria nova sala
      await directus.request(createItem("salas_azul", directusData));

      revalidatePath("/sala-azul/ciclos");
      return {
        success: true,
        message: "Ciclo cadastrado com sucesso!",
      };
    }
  } catch (error) {
    console.error("Erro ao salvar sala:", error);

    // Erro de validação do Zod
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar ciclo. Tente novamente.",
    };
  }
}

/**
 * Deleta uma sala
 */
export async function deleteSala(id: number) {
  try {
    await directus.request(deleteItem("salas_azul", id));

    revalidatePath("/sala-azul/ciclos");
    return {
      success: true,
      message: "Ciclo excluído com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao excluir sala:", error);
    return {
      success: false,
      error: "Erro ao excluir ciclo. Tente novamente.",
    };
  }
}
