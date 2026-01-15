"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { insertInfratorSchema, type InfratorFormValues } from "./schemas";

/**
 * Tipos para as opções de configuração
 */
export type NivelOption = {
  id: number;
  nome: string;
  cor: string;
};

export type StatusLegalOption = {
  id: number;
  nome: string;
};

export type TipoAgressaoOption = {
  id: number;
  nome: string;
};

/**
 * Campos seguros para buscar (evita o erro do alias M2M)
 * NUNCA use * nos fields quando há relacionamento M2M
 */
const INFRATOR_FIELDS = [
  "id",
  "nome_completo",
  "cpf",
  "data_nascimento",
  "contato",
  "numero_processo",
  "nivel_id.id",
  "nivel_id.nome",
  "nivel_id.cor",
  "status_legal_id.id",
  "status_legal_id.nome",
  // Busca profunda correta para o M2M
  "tipos_agressao_lista.config_tipos_agressao_id.id",
  "tipos_agressao_lista.config_tipos_agressao_id.nome",
] as const;

/**
 * Busca as opções de configuração (níveis, status legal, tipos de agressão)
 */
export async function getOptions(): Promise<
  | {
      success: true;
      data: {
        niveis: NivelOption[];
        statusLegal: StatusLegalOption[];
        tiposAgressao: TipoAgressaoOption[];
      };
    }
  | { success: false; error: string }
> {
  try {
    const [niveis, statusLegal, tiposAgressao] = await Promise.all([
      directus.request(
        readItems("config_niveis_periculosidade", {
          fields: ["id", "nome", "cor"],
          sort: ["id"],
        })
      ) as Promise<NivelOption[]>,
      directus.request(
        readItems("config_status_legal", {
          fields: ["id", "nome"],
          sort: ["nome"],
        })
      ) as Promise<StatusLegalOption[]>,
      directus.request(
        readItems("config_tipos_agressao", {
          fields: ["id", "nome"],
          sort: ["nome"],
        })
      ) as Promise<TipoAgressaoOption[]>,
    ]);

    return {
      success: true,
      data: {
        niveis,
        statusLegal,
        tiposAgressao,
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
 * Busca todos os infratores do Directus
 */
export async function getInfratores(): Promise<
  | { success: true; data: any[] }
  | { success: false; error: string }
> {
  try {
    const infratores = await directus.request(
      readItems("infratores", {
        sort: ["nome_completo"],
        fields: INFRATOR_FIELDS as any,
      })
    );

    return { success: true, data: infratores as any[] };
  } catch (error) {
    console.error("Erro ao buscar infratores:", error);
    
    // Se falhar ao buscar com M2M aninhado, tenta buscar separadamente
    try {
      const infratores = await directus.request(
        readItems("infratores", {
          sort: ["nome_completo"],
          fields: [
            "id",
            "nome_completo",
            "cpf",
            "data_nascimento",
            "contato",
            "numero_processo",
            "nivel_id.id",
            "nivel_id.nome",
            "nivel_id.cor",
            "status_legal_id.id",
            "status_legal_id.nome",
          ] as any,
        })
      ) as any[];

      // Busca os tipos de agressão separadamente
      const infratoresComTipos = await Promise.all(
        infratores.map(async (infrator) => {
          try {
            const tiposAgressao = await directus.request(
              readItems("infratores_tipos_agressao", {
                fields: [
                  "id",
                  "infrator_id",
                  "config_tipos_agressao_id.id",
                  "config_tipos_agressao_id.nome",
                ] as any,
                filter: {
                  infrator_id: { _eq: infrator.id },
                },
              })
            );

            return {
              ...infrator,
              tipos_agressao_lista: tiposAgressao || [],
            };
          } catch (error) {
            console.warn(`Erro ao buscar tipos de agressão para infrator ${infrator.id}:`, error);
            return {
              ...infrator,
              tipos_agressao_lista: [],
            };
          }
        })
      );

      return { success: true, data: infratoresComTipos };
    } catch (fallbackError) {
      return {
        success: false,
        error: "Erro ao buscar infratores. Tente novamente.",
      };
    }
  }
}

/**
 * Salva um infrator (cria ou atualiza)
 */
export async function saveInfrator(
  data: InfratorFormValues & { id?: number }
): Promise<
  | { success: true; message: string }
  | { success: false; error: string }
> {
  // Valida os dados com Zod
  const validation = insertInfratorSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados inválidos. Verifique os campos e tente novamente.",
    };
  }

  const validatedData = validation.data;
  const { id, tipos_agressao_ids, ...fieldsToSave } = validatedData;

  try {
    // Prepara o payload do relacionamento M2M
    // Formato Directus: array de objetos para criar a ligação
    const m2mPayload = tipos_agressao_ids?.map((tipoId) => ({
      config_tipos_agressao_id: { id: tipoId }, // Vincula pelo ID
    }));

    if (id) {
      // UPDATE
      // Nota: Atualizar M2M é complexo (diff). Para simplificar,
      // neste momento atualizamos apenas os dados cadastrais.
      // Se precisar editar agressões, idealmente deletamos as relações antigas e recriamos,
      // ou usamos uma lógica de diff mais elaborada.
      await directus.request(
        updateItem(
          "infratores",
          id,
          {
            ...fieldsToSave,
            // Se quiser forçar a atualização das agressões (pode duplicar se não limpar antes):
            // tipos_agressao_lista: { create: m2mPayload }
          },
          {
            fields: ["id"], // Retorna só ID para não quebrar
          }
        )
      );

      revalidatePath("/sala-azul/infratores");
      return {
        success: true,
        message: "Infrator atualizado com sucesso!",
      };
    } else {
      // CREATE
      await directus.request(
        createItem(
          "infratores",
          {
            ...fieldsToSave,
            tipos_agressao_lista: m2mPayload, // Cria junto
          },
          {
            fields: ["id"], // Retorna só ID para não quebrar
          }
        )
      );

      revalidatePath("/sala-azul/infratores");
      return {
        success: true,
        message: "Infrator cadastrado com sucesso!",
      };
    }
  } catch (error: any) {
    console.error("Erro ao salvar infrator:", error);

    // Tratamento de Erro de CPF Único
    const isUniqueError = error?.errors?.some((e: any) =>
      e.message?.toLowerCase().includes("unique") &&
      e.message?.toLowerCase().includes("cpf")
    );

    if (isUniqueError) {
      return {
        success: false,
        error: "Este CPF já está cadastrado no sistema.",
      };
    }

    // Tratamento de erro de validação do Zod
    if (error && typeof error === "object" && "issues" in error) {
      return {
        success: false,
        error: "Dados inválidos. Verifique os campos e tente novamente.",
      };
    }

    return {
      success: false,
      error: "Erro ao salvar infrator. Verifique os dados e tente novamente.",
    };
  }
}

/**
 * Deleta um infrator
 */
export async function deleteInfrator(
  id: number
): Promise<
  | { success: true; message: string }
  | { success: false; error: string }
> {
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
