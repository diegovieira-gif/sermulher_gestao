"use server";

import { getDirectusAdmin } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import { readItems, createItem, updateItem, deleteItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { configDa, type ObserCollection, type ObserId } from "./types";
import { montarRegistro } from "./registro";

/** Mensagem do Directus, quando houver — "Erro ao salvar" sozinho não ajuda ninguém. */
function mensagemDirectus(error: unknown): string | null {
  const e = error as { errors?: { message?: string }[] };
  return e?.errors?.[0]?.message ?? null;
}

export async function getCollectionData(collection: ObserCollection, search?: string) {
  await assertAccess("observatorio");
  let config: ReturnType<typeof configDa>;
  try {
    config = configDa(collection);
  } catch {
    return { success: false, error: "Coleção não permitida." };
  }
  try {
    const filter: Record<string, unknown> = {};
    const termo = (search || "").trim();
    if (termo) {
      // Só campos que existem nesta coleção: o Directus recusa a consulta
      // inteira se o filtro citar um campo que ela não tem.
      filter._or = config.busca.map((campo) => ({ [campo]: { _icontains: termo } }));
    }

    // Relações expandidas para a tabela mostrar o nome do período.
    const fields = ["*", ...config.fields
      .filter((f) => f.type === "relation")
      .flatMap((f) => [`${f.key}.id`, `${f.key}.nome_periodo`])];

    const items = await getDirectusAdmin().request(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      readItems(collection as any, { filter, sort: config.sort, limit: -1, fields })
    );

    return { success: true, data: items };
  } catch (error: unknown) {
    console.error(`Error fetching ${collection}:`, error);
    if ((error as { response?: { status?: number } })?.response?.status === 403) {
      return { success: false, error: "Você não tem permissão para acessar esta coleção.", status: 403 };
    }
    return { success: false, error: "Erro ao carregar dados do Directus." };
  }
}

export async function saveItem(
  collection: ObserCollection,
  data: Record<string, unknown>,
  id?: ObserId
) {
  await assertAccess("observatorio");
  let config: ReturnType<typeof configDa>;
  try {
    config = configDa(collection);
  } catch {
    return { success: false, error: "Coleção não permitida." };
  }
  try {
    const { payload, faltando } = montarRegistro(config, data);
    if (faltando.length) {
      return { success: false, error: `Preencha: ${faltando.join(", ")}.` };
    }

    const directus = getDirectusAdmin();

    // O site público mostra UM consolidado por período (o último lido
    // venceria em silêncio). Um segundo para o mesmo mês é recusado.
    if (collection === "obser_dashboards") {
      const filtro: Record<string, unknown>[] = [{ periodo_id: { _eq: payload.periodo_id } }];
      if (id) filtro.push({ id: { _neq: id } });
      const existentes = await directus.request(
        readItems("obser_dashboards", { filter: { _and: filtro }, fields: ["id"], limit: 1 })
      );
      if (existentes.length) {
        return {
          success: false,
          error: "Este período já tem um consolidado. Edite o existente em vez de criar outro.",
        };
      }
    }

    const result = id
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await directus.request(updateItem(collection as any, id as any, payload))
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await directus.request(createItem(collection as any, payload));
    revalidatePath("/observatorio");
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error(`Error saving ${collection}:`, error);
    const msg = mensagemDirectus(error);
    return { success: false, error: msg ? `Erro ao salvar: ${msg}` : "Erro ao salvar item." };
  }
}

export async function removeItem(collection: ObserCollection, id: ObserId) {
  await assertAccess("observatorio");
  // O nome da coleção chega do cliente e a exclusão usa o token admin: sem
  // esta checagem, removeItem("beneficiarias", 123) apagava uma ficha.
  try {
    configDa(collection);
  } catch {
    return { success: false, error: "Coleção não permitida." };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await getDirectusAdmin().request(deleteItem(collection as any, id as any));
    revalidatePath("/observatorio");
    return { success: true };
  } catch (error: unknown) {
    console.error(`Error deleting from ${collection}:`, error);
    const msg = mensagemDirectus(error);
    return { success: false, error: msg ? `Erro ao excluir: ${msg}` : "Erro ao excluir item." };
  }
}

/** Períodos para os seletores, do mais recente ao mais antigo. */
export async function getRelationData(collection: "obser_periodos") {
  await assertAccess("observatorio");
  if (collection !== "obser_periodos") {
    return { success: false, error: "Coleção não permitida." };
  }
  try {
    const items = await getDirectusAdmin().request(
      readItems(collection, { limit: -1, fields: ["id", "nome_periodo", "ordem"], sort: ["-ordem"] })
    );
    return { success: true, data: items };
  } catch (error) {
    console.error(`Error fetching relation ${collection}:`, error);
    return { success: false, error: "Erro ao carregar dados de relação." };
  }
}
