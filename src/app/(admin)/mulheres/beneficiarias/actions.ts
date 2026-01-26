"use server";

import { redirect } from "next/navigation";
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

// Função auxiliar para limpar dados vazios
function cleanData(data: any) {
  const cleaned: any = {};
  Object.keys(data).forEach((key) => {
    // Remove strings vazias, mas mantém 0 e false
    if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
      cleaned[key] = data[key];
    } else {
      cleaned[key] = null; // Envia null explicitamente para campos vazios
    }
  });
  return cleaned;
}

export async function saveBeneficiaria(formData: FormData) {
  // Extrai dados do formulário para objeto
  const rawData: any = {};
  formData.forEach((value, key) => {
    // Tratamento especial para arrays ou checkboxes se necessário
    if (key.endsWith("[]")) {
      const realKey = key.replace("[]", "");
      if (!rawData[realKey]) rawData[realKey] = [];
      rawData[realKey].push(value);
    } else {
      rawData[key] = value;
    }
  });

  console.log(
    "📝 Tentando salvar beneficiária (Dados Brutos):",
    JSON.stringify(rawData),
  );

  // Validação Zod (Opcional, mas recomendada se o schema bater)
  // const validated = BeneficiariaSchema.safeParse(rawData);
  // if (!validated.success) { ... }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("directus_token")?.value;

    if (!token) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    // Prepara o cliente autenticado
    const client = directus.with(withToken(token));

    // Limpa strings vazias que podem quebrar o banco (ex: datas vazias)
    const payload = cleanData(rawData);

    // Remove o ID do payload se for criação
    const id = payload.id;
    delete payload.id;

    console.log("🚀 Enviando Payload para Directus:", JSON.stringify(payload));

    if (id && id !== "new") {
      // Atualização
      await client.request(updateItem("beneficiarias", id, payload));
      console.log("✅ Beneficiária atualizada com sucesso:", id);
    } else {
      // Criação
      await client.request(createItem("beneficiarias", payload));
      console.log("✅ Beneficiária criada com sucesso.");
    }
  } catch (error: any) {
    // LOG DETALHADO NO TERMINAL DO SERVIDOR
    console.error("❌ ERRO CRÍTICO AO SALVAR:", JSON.stringify(error, null, 2));

    if (error.errors) {
      console.error(
        "🔍 Detalhes do Directus:",
        JSON.stringify(error.errors, null, 2),
      );
    }

    // Retorna erro para a interface
    let msg = "Erro desconhecido ao salvar.";
    if (error.message) msg = error.message;
    if (error?.errors?.[0]?.message) msg = error.errors[0].message;

    return { success: false, error: msg };
  }

  revalidatePath("/mulheres/beneficiarias");
  redirect("/mulheres/beneficiarias");
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
