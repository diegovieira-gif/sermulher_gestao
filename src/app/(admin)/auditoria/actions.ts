"use server";

import { getDirectusAdmin } from "@/lib/directus";

export type AuditLog = {
  id: number;
  action: string;
  timestamp: string;
  collection: string;
  item: string;
  ip: string | null;
  user_agent: string | null;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

export type Revision = {
  id: number;
  collection: string;
  item: string;
  data: Record<string, any> | null;
  delta: Record<string, any> | null;
  parent: any;
};

export async function getAuditLogs(params: {
  search?: string;
  collection?: string;
  action?: string;
  user?: string;
  page?: number;
  limit?: number;
} = {}) {
  try {
    const { search, collection, action, user, page = 1, limit = 20 } = params;
    const directusUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      process.env.DIRECTUS_URL ||
      "http://192.168.0.118";
    const token = process.env.DIRECTUS_TOKEN || "";

    if (!token) {
      throw new Error("DIRECTUS_TOKEN não está configurado.");
    }

    const queryParams = new URLSearchParams();

    // Selecionar os campos necessários
    queryParams.append("fields", "id,action,timestamp,collection,item,ip,user_agent,user.id,user.first_name,user.last_name,user.email");
    
    // Ordenar pela atividade mais recente
    queryParams.append("sort", "-timestamp");
    
    // Paginação
    queryParams.append("limit", String(limit));
    queryParams.append("offset", String((page - 1) * limit));
    
    // Obter metadados de paginação
    queryParams.append("meta", "filter_count,total_count");

    // Filtros
    const andFilters: any[] = [];

    // Ocultar ações do sistema de login de rotina (opcional, mas melhor mostrar por clareza se quiser)
    // andFilters.push({ action: { _neq: "authenticate" } });

    if (action && action !== "all") {
      andFilters.push({ action: { _eq: action } });
    }

    if (collection && collection !== "all") {
      andFilters.push({ collection: { _eq: collection } });
    }

    if (user) {
      andFilters.push({ user: { _eq: user } });
    }

    if (search) {
      andFilters.push({
        _or: [
          { collection: { _icontains: search } },
          { item: { _icontains: search } },
          { user: { email: { _icontains: search } } },
          { user: { first_name: { _icontains: search } } },
          { user: { last_name: { _icontains: search } } },
        ],
      });
    }

    if (andFilters.length > 0) {
      queryParams.append("filter", JSON.stringify({ _and: andFilters }));
    }

    const response = await fetch(`${directusUrl}/activity?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Directus: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: (result.data || []) as AuditLog[],
      meta: (result.meta || { filter_count: 0, total_count: 0 }) as {
        filter_count: number;
        total_count: number;
      },
    };
  } catch (error) {
    console.error("Erro ao obter logs de auditoria:", error);
    return {
      success: false,
      data: [],
      meta: { filter_count: 0, total_count: 0 },
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

export async function getRevisionDetails(activityId: number) {
  try {
    const directusUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      process.env.DIRECTUS_URL ||
      "http://192.168.0.118";
    const token = process.env.DIRECTUS_TOKEN || "";

    if (!token) {
      throw new Error("DIRECTUS_TOKEN não está configurado.");
    }

    const response = await fetch(
      `${directusUrl}/revisions?filter[activity][_eq]=${activityId}&fields=*.*`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API de revisões do Directus: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      success: true,
      data: (result.data || []) as Revision[],
    };
  } catch (error) {
    console.error("Erro ao obter revisões da atividade:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Erro desconhecido.",
    };
  }
}

export async function getCollectionsList() {
  try {
    const directusUrl =
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      process.env.DIRECTUS_URL ||
      "http://192.168.0.118";
    const token = process.env.DIRECTUS_TOKEN || "";

    if (!token) {
      throw new Error("DIRECTUS_TOKEN não está configurado.");
    }

    const response = await fetch(`${directusUrl}/collections`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter coleções: ${response.statusText}`);
    }

    const result = await response.json();

    // Filtra apenas coleções que não são internas do directus (opcional, mas bom ter tudo de negócios)
    const collections = (result.data || [])
      .map((c: any) => ({
        collection: c.collection,
        name: c.meta?.translation?.["pt-BR"] || c.meta?.note || c.collection,
        isSystem: c.collection.startsWith("directus_"),
      }))
      .sort((a: any, b: any) => a.collection.localeCompare(b.collection));

    return {
      success: true,
      data: collections,
    };
  } catch (error) {
    console.error("Erro ao obter lista de coleções:", error);
    return {
      success: false,
      data: [],
    };
  }
}
