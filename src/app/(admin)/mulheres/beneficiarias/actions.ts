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

// URL da API (Fallback seguro para localhost)
const API_URL = process.env.DIRECTUS_API_URL || "http://192.168.0.118:8055";

// Todos os campos necessários para o form de edição funcionar e o banco gravar
const BENEFICIARIA_FIELDS = [
  "id",
  "nome_completo",
  "nome_social",
  "cpf",
  "data_nascimento",
  "raca_cor_id",
  "estado_civil_id",
  "escolaridade_id",
  "situacao_trabalho_id",
  "quantidade_filhos",
  "telefone",
  "email",
  "contato",
  "endereco",
  "numero_cad_unico",
  "perfil_socioeconomico",
  "recebe_bolsa_familia",
  "recebe_bpc",
  "possui_medida_protetiva",
  "created_at",
  "updated_at",
];

// --- Helpers Internos ---

function parseJsonField(field: any) {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return null;
    }
  }
  return field;
}

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
    if (cleaned[key] === "" || cleaned[key] === undefined || cleaned[key] === null) {
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

async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;
  const client = createDirectus(API_URL)
    .with(rest())
    .with(staticToken(token || ""));
  return { client, token };
}

// --- Ações de Leitura (Queries) ---

export async function getBeneficiarias(
  page = 1,
  search = "",
  limit = 10,
  filters?: {
    medidaProtetiva?: boolean;
    bolsaFamilia?: boolean;
    bpc?: boolean;
    bairro?: string;
  },
  sortField = "created_at",
  sortOrder: "asc" | "desc" = "desc"
) {
  const { client } = await getAuthenticatedClient();
  const offset = (page - 1) * limit;

  const filterConditions: any[] = [];

  if (search) {
    filterConditions.push({
      _or: [
        { nome_completo: { _icontains: search } },
        { cpf: { _contains: search } },
      ],
    });
  }

  if (filters?.medidaProtetiva) {
    filterConditions.push({ possui_medida_protetiva: { _eq: true } });
  }

  if (filters?.bolsaFamilia) {
    filterConditions.push({ recebe_bolsa_familia: { _eq: true } });
  }

  if (filters?.bpc) {
    filterConditions.push({ recebe_bpc: { _eq: true } });
  }

  if (filters?.bairro) {
    filterConditions.push({ endereco: { _icontains: filters.bairro } });
  }

  const filter = filterConditions.length > 0 ? { _and: filterConditions } : {};

  try {
    const items = await client.request(
      readItems("beneficiarias", {
        // @ts-ignore
        fields: BENEFICIARIA_FIELDS,
        sort: [sortOrder === "desc" ? `-${sortField}` : sortField],
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

    const parsedItems = items.map((item: any) => ({
      ...item,
      endereco: parseJsonField(item.endereco),
      contato: parseJsonField(item.contato),
    }));

    return {
      success: true,
      data: parsedItems,
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

export async function getBeneficiariasMetrics() {
  const { client } = await getAuthenticatedClient();
  try {
    const [totalRes, mpRes, bfRes, bpcRes, recentRes] = await Promise.all([
      client.request(aggregate("beneficiarias", { aggregate: { count: "*" } })),
      client.request(aggregate("beneficiarias", { aggregate: { count: "*" }, query: { filter: { possui_medida_protetiva: { _eq: true } } } })),
      client.request(aggregate("beneficiarias", { aggregate: { count: "*" }, query: { filter: { recebe_bolsa_familia: { _eq: true } } } })),
      client.request(aggregate("beneficiarias", { aggregate: { count: "*" }, query: { filter: { recebe_bpc: { _eq: true } } } })),
      client.request(
        aggregate("beneficiarias", {
          aggregate: { count: "*" },
          query: {
            filter: {
              created_at: {
                _gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              },
            },
          },
        }),
      ),
    ]);

    return {
      success: true,
      data: {
        total: Number(totalRes[0]?.count) || 0,
        medidaProtetiva: Number(mpRes[0]?.count) || 0,
        bolsaFamilia: Number(bfRes[0]?.count) || 0,
        bpc: Number(bpcRes[0]?.count) || 0,
        recentes: Number(recentRes[0]?.count) || 0,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar métricas:", error);
    return {
      success: false,
      error: "Erro ao carregar métricas.",
      data: { total: 0, medidaProtetiva: 0, bolsaFamilia: 0, bpc: 0, recentes: 0 },
    };
  }
}

export async function getBeneficiaria(id: number) {
  const { client } = await getAuthenticatedClient();
  try {
    const item = await client.request(
      readItem("beneficiarias", id, { fields: BENEFICIARIA_FIELDS as any }),
    );
    const parsedItem = {
      ...item,
      endereco: parseJsonField(item.endereco),
      contato: parseJsonField(item.contato),
    };
    return { success: true, data: parsedItem };
  } catch (error) {
    return { success: false, error: "Erro ao buscar beneficiária." };
  }
}

export async function getBeneficiariaFormOptions() {
  const { client } = await getAuthenticatedClient();
  try {
    const [racas, estadosCivis, escolaridades, situacoesTrabalho, bairros] = await Promise.all([
      client.request(readItems("config_raca_cor", { fields: ["id", "nome"], sort: ["nome"] })),
      client.request(readItems("config_estado_civil", { fields: ["id", "nome"], sort: ["nome"] })),
      client.request(readItems("config_escolaridade", { fields: ["id", "nome"], sort: ["nome"] })),
      client.request(readItems("config_situacao_trabalho", { fields: ["id", "nome"], sort: ["nome"] })),
      client.request(readItems("config_bairros", { fields: ["id", "nome"], sort: ["nome"] })),
    ]);

    return {
      success: true,
      data: { racas, estadosCivis, escolaridades, situacoesTrabalho, bairros }
    };
  } catch (error) {
    console.error("Erro ao buscar opções do formulário:", error);
    return { success: false, data: null };
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
        fields: ["nome_completo", "cpf", "telefone", "data_nascimento", "endereco"],
        sort: ["nome_completo"],
        limit: -1,
        filter,
      }),
    );
    const parsedItems = items.map((item: any) => ({
      ...item,
      endereco: parseJsonField(item.endereco),
    }));
    return { success: true, data: parsedItems };
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
  try {
    let rawData: any;
    if (input && typeof input.forEach === "function") {
      rawData = parseFormData(input);
    } else {
      rawData = input;
    }

    const cleanRawData = cleanData(rawData);
    const payload = beneficiariaSchema.parse(cleanRawData);

    if (payload.cpf) payload.cpf = payload.cpf.replace(/\D/g, "");

    const id = payload.id;
    const payloadToSend = { ...payload };
    delete payloadToSend.id;

    const { client, token } = await getAuthenticatedClient();
    if (!token) throw new Error("Usuário não autenticado.");

    if (id) {
      await client.request(updateItem("beneficiarias", id, payloadToSend));
    } else {
      await client.request(createItem("beneficiarias", payloadToSend));
    }

    revalidatePath("/mulheres/beneficiarias");
    return { success: true, message: id ? "Cadastro atualizado!" : "Cadastro realizado!" };
  } catch (error: any) {
    console.error("❌ ERRO NO SAVE:", error);
    if (error.issues) {
      const issues = error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return { success: false, error: `Erro nos campos: ${issues}` };
    }
    if (error.errors) {
      return { success: false, error: error.errors[0]?.message || "Erro no banco." };
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
    const parsedData = entregaBeneficioSchema.parse(data);

    const payload = {
      beneficiaria: parsedData.beneficiaria,
      beneficio: parsedData.beneficio,
      data_entrega: parsedData.data_entrega,
      quantidade: parsedData.quantidade,
      observacao: parsedData.observacao || null,
    };

    const novaEntrega = await client.request(
      createItem("entregas_beneficios", payload, {
        fields: [
          "id",
          "data_entrega",
          "quantidade",
          "observacao",
          "beneficio.id",
          "beneficio.nome",
          "user_created.first_name",
          "user_created.last_name",
          "user_created.email"
        ] as any,
      })
    );

    revalidatePath(`/mulheres/beneficiarias/${payload.beneficiaria}`);
    return { success: true, data: novaEntrega, message: "Entrega registrada!" };
  } catch (error) {
    console.error(error);
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

export async function findBeneficiariaByCPF(cpf: string) {
  try {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      return { success: false, error: "CPF inválido. Deve conter 11 dígitos numéricos." };
    }

    const response = await fetch("https://homolog.siged.educacao.aju.br/webservice/users/findByCPF", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 0ed9b204df3f68caeb3deca2301872c9",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userCPF: cleanCpf })
    });

    if (!response.ok) {
      return { success: false, error: `Erro na API externa: ${response.statusText}` };
    }

    const json = await response.json();
    if (json.status === "success" && Array.isArray(json.data) && json.data.length > 0) {
      return { success: true, data: json.data[0] };
    }

    return { success: true, data: null };
  } catch (error: any) {
    console.error("Error fetching findByCPF:", error);
    return { success: false, error: error?.message || "Erro de conexão ao buscar CPF." };
  }
}