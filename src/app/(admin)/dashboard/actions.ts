"use server";

import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";

export type ProximaSessao = {
  id: number;
  data: string;
  tema: string;
  nome_ciclo?: string;
  local?: string;
};

export type CasoCritico = {
  id: number;
  beneficiaria_nome: string;
  prioridade: string;
  prioridade_cor?: string;
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
    // Calcula datas para filtro de sessões (hoje até +15 dias)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeMais15Dias = new Date(hoje);
    hojeMais15Dias.setDate(hojeMais15Dias.getDate() + 15);

    // Busca todas as queries em paralelo
    const [
      infratoresResult,
      beneficiariasResult,
      sessoesResult,
      atendimentosResult,
    ] = await Promise.all([
        // Total de infratores (cadastros ativos - sem filtro de status por enquanto)
      // Nota: Se houver um campo de status para archived, adicione o filtro aqui
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

      // Próximas sessões (ciclo_sessoes) - próximos 15 dias
      directus
        .request(
          readItems("ciclo_sessoes", {
            fields: [
              "id",
              "data",
              "tema",
              "sala_id.id",
              "sala_id.nome_ciclo",
              "sala_id.local_id.nome",
            ],
            filter: {
              data: {
                _gte: hoje.toISOString().split("T")[0],
                _lte: hojeMais15Dias.toISOString().split("T")[0],
              },
            },
            sort: ["data"],
            limit: 4,
          })
        )
        .catch((err): any[] => {
          console.error("❌ Erro ao buscar ciclo_sessoes:", err);
          return [];
        }),

      // Casos em andamento (atendimentos - traz os 5 últimos em andamento)
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
              "prioridade_id.cor",
            ],
            filter: {
              status: {
                _eq: "Em andamento",
              },
            },
            sort: ["-data_abertura"], // Ordena por data de criação (mais recentes primeiro)
            limit: 5,
          })
        )
        .catch((err): any[] => {
          console.error("❌ Erro ao buscar atendimentos em andamento:", err);
          return [];
        }),
    ]);

    // Processa as sessões: transforma em formato simples
    const agenda: ProximaSessao[] = (sessoesResult as any[])
      .map((sessao: any) => ({
        id: sessao.id,
        data: sessao.data,
        tema: sessao.tema || "Sem tema",
        nome_ciclo: sessao.sala_id?.nome_ciclo || "Ciclo sem nome",
        local:
          sessao.sala_id?.local_id?.nome || "Local não definido",
      }))
      .filter((s) => s.data); // Remove sessões sem data

    // Processa casos em andamento: transforma todos os 5 atendimentos em andamento
    const casosCriticos: CasoCritico[] = (atendimentosResult as any[])
      .map((atendimento: any) => ({
        id: atendimento.id,
        beneficiaria_nome:
          atendimento.beneficiaria?.nome_completo || "Não informado",
        prioridade: atendimento.prioridade_id?.nome || "Sem prioridade",
        prioridade_cor: atendimento.prioridade_id?.cor || undefined,
        data_abertura: atendimento.data_abertura || "",
        status: atendimento.status || "Em andamento",
      }))
      .filter((c) => c.id); // Remove atendimentos inválidos

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
