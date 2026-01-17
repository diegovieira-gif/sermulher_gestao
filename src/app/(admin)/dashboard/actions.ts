"use server";

import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";

export type ProximaSessao = {
  id: number;
  data: string;
  tema: string;
  local?: string;
};

export type CasoCritico = {
  id: number;
  beneficiaria_nome: string;
  prioridade: string;
  data_abertura: string;
  status: string;
};

export type GlobalDashboardStats = {
  totais: {
    infratores: number;
    beneficiarias: number;
  };
  agenda: ProximaSessao[];
  casosCriticos: CasoCritico[];
};

/**
 * Busca estatísticas globais do dashboard unificando dados de "Sala Azul" e "Mulheres"
 */
export async function getGlobalDashboardStats(): Promise<
  | { success: true; data: GlobalDashboardStats }
  | { success: false; error: string }
> {
  try {
    // Calcula datas para filtro de sessões (hoje até +7 dias)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeMais7Dias = new Date(hoje);
    hojeMais7Dias.setDate(hojeMais7Dias.getDate() + 7);

    // Busca todas as queries em paralelo
    const [
      infratoresResult,
      beneficiariasResult,
      sessoesResult,
      atendimentosResult,
    ] = await Promise.all([
      // Total de infratores (cadastros ativos)
      directus
        .request(
          readItems("infratores", {
            limit: -1,
            fields: ["id"],
          })
        )
        .catch((err): any[] => {
          console.error("❌ Erro ao buscar infratores:", err);
          return [];
        }),

      // Total de beneficiárias
      directus
        .request(
          readItems("beneficiarias", {
            limit: -1,
            fields: ["id"],
          })
        )
        .catch((err): any[] => {
          console.error("❌ Erro ao buscar beneficiarias:", err);
          return [];
        }),

      // Próximas sessões (ciclo_sessoes) - próximos 7 dias
      directus
        .request(
          readItems("ciclo_sessoes", {
            fields: [
              "id",
              "data",
              "tema",
              "sala_id.id",
              "sala_id.local_id.nome",
            ],
            filter: {
              data: {
                _gte: hoje.toISOString().split("T")[0],
                _lte: hojeMais7Dias.toISOString().split("T")[0],
              },
            },
            sort: ["data"],
            limit: 3,
          })
        )
        .catch((err): any[] => {
          console.error("❌ Erro ao buscar ciclo_sessoes:", err);
          return [];
        }),

      // Casos críticos (atendimentos em andamento com prioridade alta)
      directus
        .request(
          readItems("atendimentos", {
            fields: [
              "id",
              "status",
              "data_abertura",
              "beneficiaria.id",
              "beneficiaria.nome_completo",
              "prioridade_id.id",
              "prioridade_id.nome",
            ],
            filter: {
              status: {
                _eq: "Em andamento",
              },
            },
            sort: ["-data_abertura"],
            limit: 50, // Busca mais para filtrar depois
          })
        )
        .catch((err): any[] => {
          console.error("❌ Erro ao buscar atendimentos críticos:", err);
          return [];
        }),
    ]);

    // Processa as sessões: transforma em formato simples
    const agenda: ProximaSessao[] = (sessoesResult as any[])
      .map((sessao: any) => ({
        id: sessao.id,
        data: sessao.data,
        tema: sessao.tema || "Sem tema",
        local:
          sessao.sala_id?.local_id?.nome || "Local não definido",
      }))
      .filter((s) => s.data); // Remove sessões sem data

    // Processa casos críticos: filtra por prioridade alta (Emergência ou Urgente)
    const casosCriticos: CasoCritico[] = (atendimentosResult as any[])
      .map((atendimento: any) => ({
        id: atendimento.id,
        beneficiaria_nome:
          atendimento.beneficiaria?.nome_completo || "Não informado",
        prioridade: atendimento.prioridade_id?.nome || "Sem prioridade",
        data_abertura: atendimento.data_abertura || "",
        status: atendimento.status || "Em andamento",
      }))
      .filter((c) => {
        // Filtra apenas casos de alta prioridade (Emergência ou Urgente)
        const prioridade = c.prioridade?.toLowerCase() || "";
        return (
          c.id &&
          (prioridade.includes("emergência") ||
            prioridade.includes("emergencia") ||
            prioridade.includes("urgente"))
        );
      })
      .slice(0, 5); // Limita a 5 casos

    return {
      success: true,
      data: {
        totais: {
          infratores: infratoresResult.length,
          beneficiarias: beneficiariasResult.length,
        },
        agenda,
        casosCriticos,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas globais:", error);
    return {
      success: false,
      error: "Erro ao carregar dados do dashboard. Tente novamente.",
    };
  }
}
