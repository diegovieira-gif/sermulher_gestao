"use server";

import { revalidatePath } from "next/cache";
import { directus } from "@/lib/directus";
import {
  readItems,
  createItem,
  updateItem,
  deleteItem,
  readItem,
  aggregate,
} from "@directus/sdk";
import { beneficiariaSchema, entregaBeneficioSchema } from "./schemas";

const BENEFICIARIA_FIELDS = [
  "id",
  "nome_completo",
  "cpf",
  "data_nascimento",
  "telefone",
  "email",
  "endereco",
  "perfil_socioeconomico",
  "recebe_bolsa_familia",
  "recebe_bpc",
  "possui_medida_protetiva",
] as const;

const normalizeDate = (value?: string | null) => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/**
 * Busca beneficiárias com paginação e filtro
 */
export async function getBeneficiarias(page = 1, search = "") {
  const limit = 10; // Itens por página
  const offset = (page - 1) * limit;

  // Filtro de busca (Nome ou CPF)
  const filter = search
    ? {
        _or: [
          { nome_completo: { _icontains: search } },
          { cpf: { _contains: search } },
        ],
      }
    : {};

  try {
    // 1. Busca os dados paginados
    const items = await directus.request(
      readItems("beneficiarias", {
        // @ts-ignore
        fields: BENEFICIARIA_FIELDS,
        sort: ["nome_completo"],
        limit,
        offset,
        filter,
      }),
    );

    // 2. Busca o total de registros (para calcular páginas)
    const countResult = await directus.request(
      aggregate("beneficiarias", {
        aggregate: { count: "*" },
        query: { filter },
      }),
    );

    // @ts-ignore
    const total = Number(countResult[0]?.count) || 0;

    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Erro ao buscar beneficiárias:", error);
    return {
      success: false,
      error: "Erro ao buscar beneficiárias. Tente novamente.",
    };
  }
}

/**
 * Busca TODOS os dados para Exportação (CSV)
 */
export async function getBeneficiariasExport(search = "") {
  const filter = search
    ? {
        _or: [
          { nome_completo: { _icontains: search } },
          { cpf: { _contains: search } },
        ],
      }
    : {};

  try {
    const items = await directus.request(
      readItems("beneficiarias", {
        // @ts-ignore
        fields: [
          "nome_completo",
          "cpf",
          "telefone",
          "data_nascimento",
          "endereco",
        ],
        sort: ["nome_completo"],
        limit: -1, // Busca tudo
        filter,
      }),
    );
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: "Erro ao exportar dados." };
  }
}

/**
 * Histórico de entregas de benefícios
 */
export async function getHistoricoBeneficios(beneficiariaId: string) {
  try {
    const historico = await directus.request(
      readItems("entregas_beneficios", {
        filter: { beneficiaria: { _eq: beneficiariaId } },
        sort: ["-data_entrega"],
        fields: [
          "*",
          // @ts-ignore
          "beneficio.id",
          "beneficio.nome",
          "user_created.first_name",
          "user_created.last_name",
        ],
      }),
    );
    return { success: true, data: historico };
  } catch (error) {
    return { success: false, error: "Erro ao carregar histórico." };
  }
}

// --- Funções CRUD Padrão (Mantidas Simples) ---

export async function registrarEntrega(data: unknown) {
  try {
    const payload = entregaBeneficioSchema.parse(data);
    await directus.request(createItem("entregas_beneficios", payload));
    revalidatePath(`/mulheres/beneficiarias/${payload.beneficiaria}`);
    return { success: true, message: "Entrega registrada!" };
  } catch (error) {
    return { success: false, error: "Erro ao registrar entrega." };
  }
}

export async function deletarEntrega(id: number, beneficiariaId: number) {
  try {
    await directus.request(deleteItem("entregas_beneficios", id));
    revalidatePath(`/mulheres/beneficiarias/${beneficiariaId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir." };
  }
}

export async function getBeneficiaria(id: number) {
  try {
    const item = await directus.request(
      readItem("beneficiarias", id, { fields: BENEFICIARIA_FIELDS }),
    );
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: "Erro ao buscar." };
  }
}

export async function saveBeneficiaria(data: unknown) {
  try {
    const val = beneficiariaSchema.parse(data);
    const payload: any = { ...val };
    if (val.cpf) payload.cpf = val.cpf.replace(/\D/g, "");

    if (val.id) {
      await directus.request(updateItem("beneficiarias", val.id, payload));
      revalidatePath("/mulheres/beneficiarias");
      return { success: true, message: "Atualizado!" };
    } else {
      await directus.request(createItem("beneficiarias", payload));
      revalidatePath("/mulheres/beneficiarias");
      return { success: true, message: "Criado!" };
    }
  } catch (error) {
    return { success: false, error: "Erro ao salvar." };
  }
}

export async function deleteBeneficiaria(id: number) {
  try {
    await directus.request(deleteItem("beneficiarias", id));
    revalidatePath("/mulheres/beneficiarias");
    return { success: true, message: "Excluído!" };
  } catch (error) {
    return { success: false, error: "Erro ao excluir." };
  }
}
