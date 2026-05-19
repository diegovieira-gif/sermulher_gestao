"use server";

import { directus } from "@/lib/directus";
import { createItem, deleteItem, readItems, updateItem } from "@directus/sdk";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const SITE_CONFIG_COLLECTION = "configuracoes_site";
const PROPOSTAS_COLLECTION = "site_propostas";
const REVALIDATE_PATH = "/configuracoes/site";

type RecordPayload = Record<string, unknown>;

type DirectusRecord = RecordPayload & {
  id?: string | number;
};

type DirectusErrorLike = {
  message?: string;
  response?: {
    status?: number;
  };
  status?: number;
};

function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function handleActionError(error: unknown, fallbackMessage: string) {
  const directusError = error as DirectusErrorLike;
  const message = typeof directusError?.message === "string" ? directusError.message : "";

  if (message === "NEXT_REDIRECT") {
    throw error;
  }

  const isUnauthorized =
    directusError?.response?.status === 401 ||
    directusError?.status === 401 ||
    message.includes("Authentication required") ||
    message.includes("Invalid user credentials");

  if (isUnauthorized) {
    redirect("/login?error=unauthorized");
  }

  console.error(fallbackMessage, error);
  return {
    success: false,
    error: message || fallbackMessage,
  };
}

export async function getSiteConfig() {
  try {
    const items = await directus.request(
      readItems(SITE_CONFIG_COLLECTION, {
        limit: 1,
        fields: ["*"],
      }),
    );

    return {
      success: true,
      data: items?.[0] ? toPlainObject(items[0]) : null,
    };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao buscar configurações do site.");
  }
}

export async function createSiteConfig(data: RecordPayload) {
  try {
    const result = await directus.request(
      createItem(SITE_CONFIG_COLLECTION, data),
    );

    revalidatePath(REVALIDATE_PATH);

    return { success: true, data: toPlainObject(result) as DirectusRecord };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao criar configurações do site.");
  }
}

export async function updateSiteConfig(id: string | number, data: RecordPayload) {
  try {
    const result = await directus.request(
      updateItem(SITE_CONFIG_COLLECTION, id, data),
    );

    revalidatePath(REVALIDATE_PATH);

    return { success: true, data: toPlainObject(result) as DirectusRecord };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao atualizar configurações do site.");
  }
}

export async function getPropostas() {
  try {
    const items = await directus.request(
      readItems(PROPOSTAS_COLLECTION, {
        fields: ["*"],
        sort: ["ordem", "-date_created"],
        limit: -1,
      }),
    );

    return {
      success: true,
      data: Array.isArray(items) ? toPlainObject(items) : [],
    };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao buscar propostas do site.");
  }
}

export async function createProposta(data: RecordPayload) {
  try {
    const result = await directus.request(createItem(PROPOSTAS_COLLECTION, data));

    revalidatePath(REVALIDATE_PATH);

    return { success: true, data: toPlainObject(result) as DirectusRecord };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao criar proposta.");
  }
}

export async function updateProposta(id: string | number, data: RecordPayload) {
  try {
    const result = await directus.request(
      updateItem(PROPOSTAS_COLLECTION, id, data),
    );

    revalidatePath(REVALIDATE_PATH);

    return { success: true, data: toPlainObject(result) as DirectusRecord };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao atualizar proposta.");
  }
}

export async function deleteProposta(id: string | number) {
  try {
    await directus.request(deleteItem(PROPOSTAS_COLLECTION, id));

    revalidatePath(REVALIDATE_PATH);

    return { success: true };
  } catch (error: unknown) {
    return handleActionError(error, "Erro ao excluir proposta.");
  }
}