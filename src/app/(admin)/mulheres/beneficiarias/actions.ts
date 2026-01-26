"use server";

import { revalidatePath } from "next/cache";
import {
  createDirectus,
  rest,
  staticToken,
  readItems,
  createItem,
  updateItem,
  deleteItem,
  readItem,
  aggregate,
} from "@directus/sdk";
import { cookies } from "next/headers";
import { beneficiariaSchema, entregaBeneficioSchema } from "./schemas";

// URL da API (Fallback seguro para localhost caso ENV falhe)
const API_URL = process.env.DIRECTUS_API_URL || "http://192.168.0.115:8055";

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

// --- Helpers Internos ---

function parseFormData(formData: FormData) {
  const data: any = {};
  formData.forEach((value, key) => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      if (!data[parent]) data[parent] = {};
      data[parent][child] = value;
    } else {
      data[key] = value;
    }
  });
  return data;
}

function cleanData(data: any) {
  const cleaned = JSON.parse(JSON.stringify(data));
  Object.keys(cleaned).forEach((key) => {
    if (
      cleaned[key] === "" ||
      cleaned[key] === undefined ||
      cleaned[key] === null
    ) {
      cleaned[key] = null;
    }
    if (typeof cleaned[key] === "object" && cleaned[key] !== null) {
      Object.keys(cleaned[key]).forEach((subKey) => {
        if (cleaned[key][subKey] === "") cleaned[key][subKey] = null;
      });
    }
  });
  return cleaned;
}

// Função para obter cliente autenticado
async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;

  // Cria uma nova instância limpa para evitar conflitos com o cliente global
  const client = createDirectus(API_URL)
    .with(rest())
    .with(staticToken(token || "")); // Se não tiver token, usa string vazia (vai dar erro 403 se rota for privada)

  return { client, token };
}

// --- Ações de Leitura (Queries) ---

export async function getBeneficiarias(page = 1, search = "") {
  const { client } = await getAuthenticatedClient();
  const limit = 10;
  const offset = (page - 1) * limit;

  const filter = search
    ? {
        _or: [
          { nome_completo: { _icontains: search } },
          { cpf: { _contains: search } },
        ],
      }
    : {};

  try {
    const items = await client.request(
      readItems("beneficiarias", {
        // @ts-ignore
        fields: BENEFICIARIA_FIELDS,
        sort: ["nome_completo"],
        limit,
        offset,
        filter,
      }),
    );

    const countResult = await client.request(
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
    return { success: false, error: "Erro ao buscar dados." };
  }
}

export async function getBeneficiaria(id: number) {
  const { client } = await getAuthenticatedClient();
  try {
    const item = await client.request(
      readItem("beneficiarias", id, { fields: BENEFICIARIA_FIELDS }),
    );
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: "Erro ao buscar beneficiária." };
  }
}

export async function getBeneficiariasExport(search = "") {
  const { client } = await getAuthenticatedClient();
  const filter = search
    ? {
        _or: [
          { nome_completo: { _icontains: search } },
          { cpf: { _contains: search } },
        ],
      }
    : {};

  try {
    const items = await client.request(
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
        limit: -1,
        filter,
      }),
    );
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: "Erro ao exportar." };
  }
}

export async function getHistoricoBeneficios(beneficiariaId: string) {
  const { client } = await getAuthenticatedClient();
  try {
    const historico = await client.request(
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

// --- Ações de Escrita (Mutations) ---

export async function saveBeneficiaria(input: any) {
  console.log("📝 [Server Action] Iniciando saveBeneficiaria...");

  try {
    let rawData: any;

    // Detecção: FormData vs JSON
    if (input && typeof input.forEach === "function") {
      rawData = parseFormData(input);
    } else {
      rawData = input;
    }

    const cleanRawData = cleanData(rawData);

    // Validação Zod com Coerção
    const payload = beneficiariaSchema.parse(cleanRawData);

    if (payload.cpf) payload.cpf = payload.cpf.replace(/\D/g, "");

    const id = payload.id;
    const payloadToSend = { ...payload };
    delete payloadToSend.id;

    // CLIENTE NOVO E AUTENTICADO
    const { client, token } = await getAuthenticatedClient();

    if (!token) {
      throw new Error("Usuário não autenticado.");
    }

    console.log(
      "🚀 Enviando Payload para Directus:",
      JSON.stringify(payloadToSend),
    );

    if (id) {
      await client.request(updateItem("beneficiarias", id, payloadToSend));
      console.log("✅ Atualização concluída.");
    } else {
      await client.request(createItem("beneficiarias", payloadToSend));
      console.log("✅ Criação concluída.");
    }

    revalidatePath("/mulheres/beneficiarias");
    return {
      success: true,
      message: id ? "Cadastro atualizado!" : "Cadastro realizado!",
    };
  } catch (error: any) {
    console.error("❌ ERRO NO SAVE:", error);

    if (error.issues) {
      const issues = error.issues
        .map((i: any) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return { success: false, error: `Erro nos campos: ${issues}` };
    }

    if (error.errors) {
      return {
        success: false,
        error: error.errors[0]?.message || "Erro no banco.",
      };
    }

    return { success: false, error: "Erro desconhecido ao salvar." };
  }
}

export async function deleteBeneficiaria(id: number) {
  const { client } = await getAuthenticatedClient();
  try {
    await client.request(deleteItem("beneficiarias", id));
    revalidatePath("/mulheres/beneficiarias");
    return { success: true, message: "Excluído com sucesso!" };
  } catch (error) {
    console.error("Erro ao excluir:", error);
    return { success: false, error: "Erro ao excluir registro." };
  }
}

export async function registrarEntrega(data: unknown) {
  const { client } = await getAuthenticatedClient();
  try {
    const payload = entregaBeneficioSchema.parse(data);
    await client.request(createItem("entregas_beneficios", payload));
    revalidatePath(`/mulheres/beneficiarias/${payload.beneficiaria}`);
    return { success: true, message: "Entrega registrada!" };
  } catch (error) {
    return { success: false, error: "Erro ao registrar entrega." };
  }
}

export async function deletarEntrega(id: number, beneficiariaId: number) {
  const { client } = await getAuthenticatedClient();
  try {
    await client.request(deleteItem("entregas_beneficios", id));
    revalidatePath(`/mulheres/beneficiarias/${beneficiariaId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao excluir." };
  }
}
