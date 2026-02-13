"use server";

import { directus } from "@/lib/directus";
import {
  readItems,
  createItem,
  updateItem,
  deleteItem,
  aggregate,
} from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { marketingPostSchema } from "./schemas";

const COLLECTION = "marketing_items";

// Helper para converter FormData ou Objeto em JSON limpo
function parsePayload(data: any) {
  let payload: any = {};

  // Se for FormData (envio nativo do form)
  if (data && typeof data.forEach === "function") {
    data.forEach((value: any, key: string) => {
      // Ignora chaves internas do Next.js ($ACTION_...)
      if (!key.startsWith("$")) {
        payload[key] = value;
      }
    });
  } else {
    // Se já for um objeto JS
    payload = { ...data };
  }

  // Tratamento de tipos numéricos
  if (payload.alcance) payload.alcance = Number(payload.alcance);
  if (payload.campanha_id !== undefined && payload.campanha_id !== null)
    payload.campanha_id = Number(payload.campanha_id);

  return payload;
}

// 1. Listar Itens
export async function getMarketingItems() {
  try {
    const items = await directus.request(
      readItems(COLLECTION, {
        // Traz a campanha populada
        // @ts-ignore fields are dynamic
        fields: ["*", "campanha_id.*"],
        sort: ["-data_publicacao"],
        limit: 50, // Limite para garantir performance
      }),
    );
    return { success: true, data: items };
  } catch (error) {
    console.error("Erro ao buscar items de marketing:", error);
    return { success: false, data: [] };
  }
}

// 2. Salvar (Criar ou Atualizar)
export async function saveMarketingItem(data: any) {
  try {
    // 1. Normaliza os dados
    const rawPayload = parsePayload(data);
    const id = rawPayload.id;

    // Remove o ID do payload para não tentar salvar no banco
    delete rawPayload.id;

    // 2. Validação com Zod
    const validationResult = marketingPostSchema.safeParse(rawPayload);

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || "Erro de validação";
      return {
        success: false,
        error: errorMsg,
      };
    }

    const payload = validationResult.data;

    console.log("📦 Payload Marketing Validado:", payload);

    if (id) {
      await directus.request(updateItem(COLLECTION, id, payload));
    } else {
      await directus.request(createItem(COLLECTION, payload));
    }

    revalidatePath("/admin/marketing");
    return { success: true, message: "Salvo com sucesso!" };
  } catch (error: any) {
    console.error(
      "❌ Erro ao salvar marketing:",
      JSON.stringify(error, null, 2),
    );

    // Retorna erro amigável se for validação do Directus
    if (error?.errors?.[0]?.message) {
      return { success: false, error: `Erro: ${error.errors[0].message}` };
    }
    return { success: false, error: "Erro ao salvar item." };
  }
}

// 3. Deletar
export async function deleteMarketingItem(id: number) {
  try {
    await directus.request(deleteItem(COLLECTION, id));
    revalidatePath("/admin/marketing");
    return { success: true, message: "Item removido!" };
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return { success: false, error: "Erro ao deletar." };
  }
}

// 4. Estatísticas Avançadas
export async function getMarketingStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    // Busca Paralela: Totais e Agrupamentos
    const [totais, porCanal, porCampanha, topPost] = await Promise.all([
      // A. Soma de Alcance e Contagem Total
      directus
        .request(
          aggregate(COLLECTION, {
            aggregate: { count: "*", sum: ["alcance"] },
            query: {
              filter: {
                data_publicacao: { _between: [startOfMonth, endOfMonth] },
              },
            },
          }),
        )
        .catch((err) => {
          console.error("Erro ao buscar totais:", err);
          return null;
        }),

      // B. Agrupar por Canal (Para gráfico)
      directus
        .request(
          aggregate(COLLECTION, {
            groupBy: ["canal"],
            aggregate: { count: "*" },
            query: {
              filter: {
                data_publicacao: { _between: [startOfMonth, endOfMonth] },
              },
            },
          }),
        )
        .catch((err) => {
          console.error("Erro ao agrupar por canal (verificar permissões):", err);
          return [];
        }),

      // C. Agrupar por Campanha (Para contar quantas ativas)
      directus
        .request(
          aggregate(COLLECTION, {
            groupBy: ["campanha_id"],
            aggregate: { count: "*" },
            query: {
              filter: {
                data_publicacao: { _between: [startOfMonth, endOfMonth] },
              },
            },
          }),
        )
        .catch((err) => {
          console.error("Erro ao agrupar por campanha:", err);
          return [];
        }),

      // D. Top Post por Alcance
      directus
        .request(
          readItems(COLLECTION, {
            sort: ["-alcance"],
            limit: 1,
            filter: {
              data_publicacao: { _between: [startOfMonth, endOfMonth] },
              alcance: { _nnull: true },
            },
          }),
        )
        .catch((err) => {
          console.error("Erro ao buscar top post:", err);
          return [];
        }),
    ]);

    const result = totais && totais[0] ? totais[0] : null;
    const totalPosts = Number(result?.count || 0);
    const alcanceTotal = Number(result?.sum?.alcance || 0);

    // Formatando dados para Recharts
    const postsPorCanal =
      // @ts-ignore
      porCanal?.map((item: any) => ({
        name: item.canal || "Outros",
        value: Number(item.count),
      })) || [];

    // Contar campanhas únicas (IDs distintos com campanha_id não nulo)
    // @ts-ignore group items structure from Directus
    const campanhasAtivas = Array.isArray(porCampanha)
      ? new Set(
        porCampanha.filter((c) => c.campanha_id).map((c) => c.campanha_id),
      ).size
      : 0;

    const topAlcance =
      topPost && topPost.length > 0
        ? {
          titulo: topPost[0].titulo,
          alcance: topPost[0].alcance,
          canal: topPost[0].canal,
        }
        : null;

    return {
      totalPosts,
      postsPorCanal,
      alcanceTotal,
      campanhasAtivas,
      topAlcance,
    };
  } catch (error) {
    console.error("Erro stats:", error);
    return {
      totalPosts: 0,
      postsPorCanal: [],
      alcanceTotal: 0,
      campanhasAtivas: 0,
      topAlcance: null,
    };
  }
}
