"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { insertInfratorSchema, type Infrator } from "./schemas";

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
export async function getInfratores() {
  try {
    // Busca infratores com campos específicos para evitar problemas com aliases M2M
    const infratores = await directus.request(
      readItems("infratores", {
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
        ],
        sort: ["nome_completo"],
      })
    );

    // Busca os tipos de agressão separadamente via relacionamento M2M
    // Para cada infrator, busca os tipos de agressão relacionados
    const infratoresComTipos = await Promise.all(
      (infratores as any[]).map(async (infrator) => {
        try {
          // Busca os tipos de agressão relacionados a este infrator
          const tiposAgressao = await directus.request(
            readItems("infratores_tipos_agressao", {
              fields: [
                "id",
                "infrator_id",
                "config_tipos_agressao_id.id",
                "config_tipos_agressao_id.nome",
              ],
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

    // Prepara os dados para o Directus (separando campos simples do M2M)
    const { tipos_agressao_ids, id, ...simpleData } = validatedData;

    if (validatedData.id) {
      // Para atualização, precisamos:
      // 1. Atualizar os campos simples (sem M2M)
      // 2. Deletar relações antigas
      // 3. Criar novas relações

      // 1. Atualiza apenas os campos simples (sem tipos_agressao_lista)
      await directus.request(
        updateItem("infratores", validatedData.id, simpleData)
      );

      // 2. Busca e deleta as relações antigas na tabela intermediária
      const relacoesAntigas = await directus.request(
        readItems("infratores_tipos_agressao", {
          fields: ["id"],
          filter: { infrator_id: { _eq: validatedData.id } },
        })
      ).catch(() => []);

      // Deleta as relações antigas
      if (Array.isArray(relacoesAntigas)) {
        for (const relacao of relacoesAntigas) {
          if (relacao?.id) {
            try {
              await directus.request(
                deleteItem("infratores_tipos_agressao", relacao.id)
              );
            } catch (deleteError) {
              console.warn("Erro ao deletar relação antiga:", deleteError);
            }
          }
        }
      }

      // 3. Cria as novas relações M2M
      for (const tipoId of tipos_agressao_ids) {
        try {
          await directus.request(
            createItem("infratores_tipos_agressao", {
              infrator_id: validatedData.id,
              config_tipos_agressao_id: tipoId,
            })
          );
        } catch (createError) {
          console.warn("Erro ao criar relação:", createError);
        }
      }

      revalidatePath("/sala-azul/infratores");
      return {
        success: true,
        message: "Infrator atualizado com sucesso!",
      };
    } else {
      // Para criação, precisamos:
      // 1. Criar o infrator (sem tipos_agressao_lista)
      // 2. Criar as relações M2M separadamente

      // 1. Cria o infrator sem os relacionamentos M2M
      const novoInfrator = await directus.request(
        createItem("infratores", simpleData)
      );

      // 2. Cria as relações M2M na tabela intermediária
      const infratorId = (novoInfrator as any)?.id;
      if (infratorId) {
        for (const tipoId of tipos_agressao_ids) {
          try {
            await directus.request(
              createItem("infratores_tipos_agressao", {
                infrator_id: infratorId,
                config_tipos_agressao_id: tipoId,
              })
            );
          } catch (createError) {
            console.warn("Erro ao criar relação M2M:", createError);
          }
        }
      }

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
