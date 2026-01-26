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
  withToken,
} from "@directus/sdk";
import { cookies } from "next/headers";
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

// Função para limpar dados (remove strings vazias)
function cleanData(data: any) {
  const cleaned: any = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
      cleaned[key] = data[key];
    } else {
      cleaned[key] = null;
    }
  });
  return cleaned;
}

export async function saveBeneficiaria(data: unknown) {
  console.log("📝 [Server Action] Iniciando saveBeneficiaria...");

  try {
    // 1. Validação Zod
    const val = beneficiariaSchema.parse(data);
    const payload: any = { ...val };

    // Limpeza
    if (payload.cpf) payload.cpf = payload.cpf.replace(/\D/g, "");

    // Remove campos vazios/nulos
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === undefined)
        payload[key] = null;
    });

    const id = payload.id;
    delete payload.id; // Não envia ID no corpo do payload

    // 2. Cliente com Token
    const cookieStore = await cookies();
    const token = cookieStore.get("directus_token")?.value;
    const client = token ? directus.with(withToken(token)) : directus;

    console.log("🚀 Payload:", JSON.stringify(payload));

    if (id) {
      await client.request(updateItem("beneficiarias", id, payload));
    } else {
      await client.request(createItem("beneficiarias", payload));
    }

    revalidatePath("/mulheres/beneficiarias");
    return { success: true, message: "Salvo com sucesso!" };
  } catch (error: any) {
    console.error("❌ ERRO FATAL NO SAVE:", error);
    if (error.errors)
      console.error(
        "🔍 Erros Directus:",
        JSON.stringify(error.errors, null, 2),
      );

    // Tenta extrair mensagem legível
    let msg = "Erro ao salvar.";
    if (error?.errors?.[0]?.message) msg = error.errors[0].message;

    return { success: false, error: msg };
  }
}

export async function deleteBeneficiaria(id: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("directus_token")?.value;
    const client = token ? directus.with(withToken(token)) : directus;

    await client.request(deleteItem("beneficiarias", id));
    revalidatePath("/mulheres/beneficiarias");
    return { success: true, message: "Excluído com sucesso!" };
  } catch (error: any) {
    console.error("❌ Erro ao excluir:", error);
    return { success: false, error: "Erro ao excluir registro." };
  }
}

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
