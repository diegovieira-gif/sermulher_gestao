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
  if (payload.interacoes) payload.interacoes = Number(payload.interacoes);

  return payload;
}

// 1. Listar Itens
export async function getMarketingItems() {
  try {
    const items = await directus.request(
      readItems(COLLECTION, {
        sort: ["-data_publicacao"],
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
    const payload = parsePayload(data);
    const id = payload.id;

    // Remove o ID do payload para não tentar salvar no banco
    delete payload.id;

    console.log("📦 Payload Marketing:", payload);

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

    // Retorna erro amigável se for validação
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

// 4. Estatísticas
export async function getMarketingStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const result = await directus.request(
      aggregate(COLLECTION, {
        aggregate: {
          count: "*",
          sum: ["alcance", "interacoes"],
        },
        query: {
          filter: {
            data_publicacao: { _between: [startOfMonth, endOfMonth] },
          },
        },
      }),
    );

    const stats = result && result[0] ? result[0] : null;

    return {
      postsMes: Number(stats?.count || 0),
      alcanceMes: Number(stats?.sum?.alcance || 0),
      interacoesMes: Number(stats?.sum?.interacoes || 0),
    };
  } catch (error) {
    console.error("Erro stats:", error);
    return { postsMes: 0, alcanceMes: 0, interacoesMes: 0 };
  }
}
