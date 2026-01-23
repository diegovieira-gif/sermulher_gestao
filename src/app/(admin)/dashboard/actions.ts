"use server";

import { directus } from "@/lib/directus";
import { readItems, aggregate } from "@directus/sdk";

// Tipo de retorno para o Dashboard
export type DashboardStats = {
  kpis: {
    totalAtendimentosMes: number;
    novosCasos: number;
    mulheresAcompanhamento: number;
    demandaReprimida: number;
  };
  atendimentosPorDia: Array<{
    data: string;
    quantidade: number;
  }>;
  proximosEventos: Array<{
    id: string | number;
    titulo: string;
    data_inicio: string;
    tipo_id?: { nome: string; cor?: string };
  }>;
  alertasMedidasProtetivas: Array<{
    id: string | number;
    nome_completo: string;
  }>;
  // Compatibilidade com interface genérica
  totalAtendimentos?: number;
  totalAlunas?: number;
  totalInfratores?: number;
  growthAtendimentos?: string;
  growthAlunas?: string;
  growthInfratores?: string;
};

export async function getDashboardStats(): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  // Data para gráfico (últimos 30 dias)
  const chartStartDate = new Date();
  chartStartDate.setDate(chartStartDate.getDate() - 30);
  const chartStartDateStr = chartStartDate.toISOString().split("T")[0];

  try {
    // Executa as queries em paralelo para performance
    const [
      atendimentosCount,
      atendimentosGrafico,
      rawMatriculas,
      proximosEventos,
      infratoresCount,
    ] = await Promise.all([
      // A. KPI: Atendimentos Mês Atual
      directus.request(
        aggregate("atendimentos", {
          aggregate: { count: "*" },
          query: {
            filter: { data_abertura: { _between: [startOfMonth, endOfMonth] } },
          },
        }),
      ),

      // B. Gráfico: Atendimentos recentes
      // @ts-ignore
      directus.request(
        readItems("atendimentos", {
          filter: { data_abertura: { _gte: chartStartDateStr } },
          fields: ["data_abertura"],
          limit: -1,
          sort: ["data_abertura"],
        }),
      ),

      // C. KPI: Alunas Ativas (Escola)
      // @ts-ignore
      directus
        .request(
          readItems("escola_matriculas", {
            fields: ["status"],
            filter: {
              status: { _in: ["ativa", "cursando", "matriculada", "aprovada"] },
            },
            limit: -1,
          }),
        )
        .catch(() => []),

      // D. Lista: Próximos Eventos (Tabela correta: eventos_campanhas)
      // @ts-ignore
      directus
        .request(
          readItems("eventos_campanhas", {
            filter: {
              data_inicio: { _gte: now.toISOString().split("T")[0] },
              status: { _neq: "cancelado" },
            },
            fields: ["id", "nome", "data_inicio", "local", "tipo_id.nome"],
            sort: ["data_inicio"],
            limit: 5,
          }),
        )
        .catch(() => []),

      // E. KPI: Infratores
      directus.request(
        aggregate("infratores", {
          aggregate: { count: "*" },
        }),
      ),
    ]);

    // --- Processamento ---

    // 1. Contagens
    const totalAtendimentos =
      Array.isArray(atendimentosCount) && atendimentosCount[0]?.count
        ? Number(atendimentosCount[0].count)
        : 0;

    const totalInfratores =
      Array.isArray(infratoresCount) && infratoresCount[0]?.count
        ? Number(infratoresCount[0].count)
        : 0;

    const totalAlunas = Array.isArray(rawMatriculas) ? rawMatriculas.length : 0;

    // 2. Processar Gráfico (Agrupar por Dia)
    const chartMap = new Map<string, number>();
    if (Array.isArray(atendimentosGrafico)) {
      atendimentosGrafico.forEach((item: any) => {
        if (item.data_abertura) {
          const dateKey = item.data_abertura.split("T")[0]; // YYYY-MM-DD
          chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + 1);
        }
      });
    }

    // Ordenar array do gráfico
    const atendimentosPorDia = Array.from(chartMap, ([data, quantidade]) => ({
      data,
      quantidade,
    })).sort((a, b) => a.data.localeCompare(b.data));

    // 3. Mapear Eventos (usando 'nome' em vez de 'titulo')
    const eventosFormatados = Array.isArray(proximosEventos)
      ? proximosEventos.map((evt: any) => ({
          id: evt.id,
          titulo: evt.nome, // Mapeia 'nome' do banco para 'titulo' da interface
          data_inicio: evt.data_inicio,
          tipo_id: evt.tipo_id ? { nome: evt.tipo_id.nome } : undefined,
        }))
      : [];

    const stats: DashboardStats = {
      kpis: {
        totalAtendimentosMes: totalAtendimentos,
        novosCasos: totalAtendimentos,
        mulheresAcompanhamento: totalAlunas,
        demandaReprimida: 0,
      },
      atendimentosPorDia,
      proximosEventos: eventosFormatados,
      alertasMedidasProtetivas: [],

      // Props para compatibilidade com DashboardClient
      totalAtendimentos: totalAtendimentos,
      totalAlunas: totalAlunas,
      totalInfratores: totalInfratores,
      growthAtendimentos: "+0%",
      growthAlunas: "+0%",
      growthInfratores: "+0%",
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("❌ Erro ao gerar dashboard stats:", error);
    return {
      success: false,
      error: "Erro ao carregar dados do dashboard.",
    };
  }
}
