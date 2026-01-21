"use server";

import { directus } from "@/lib/directus";
import { readItems, aggregate } from "@directus/sdk";

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
    tipo_id?: { nome: string };
  }>;
  alertasMedidasProtetivas: Array<{
    id: string | number;
    nome_completo: string;
  }>;
};

// Tipo para compatibilidade com overview-client se necessário
export type GlobalDashboardStats = {
  totais: { beneficiarias: number; infratores: number };
  agenda: any[];
  casosCriticos: any[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // Data para gráfico (últimos 15 dias para visualização diária ou 6 meses para mensal)
  const chartStartDate = new Date();
  chartStartDate.setDate(chartStartDate.getDate() - 30);
  const chartStartDateStr = chartStartDate.toISOString().split('T')[0];

  try {
    const [atendimentosCount, atendimentosGrafico, rawMatriculas, proximosEventos] = await Promise.all([
      // A. KPI: Atendimentos Mês Atual
      directus.request(aggregate('atendimentos', {
        aggregate: { count: '*' },
        query: { filter: { data_abertura: { _between: [startOfMonth, endOfMonth] } } }
      })),

      // B. Gráfico: Lista para processar no backend
      directus.request(readItems('atendimentos', {
        filter: { data_abertura: { _gte: chartStartDateStr } },
        fields: ['data_abertura'],
        limit: -1, 
        sort: ['data_abertura']
      })),

      // C. KPI: Mulheres/Alunas Ativas
      directus.request(readItems('escola_matriculas', {
        fields: ['status'],
        limit: -1 
      })).catch(() => []),

      // D. Lista: Próximos Eventos
      directus.request(readItems('eventos_campanhas', {
        filter: {
          data_inicio: { _gte: now.toISOString().split('T')[0] },
          status: { _neq: 'cancelado' }
        },
        fields: ['id', 'nome', 'data_inicio', 'local', 'tipo_id.*'],
        sort: ['data_inicio'],
        limit: 5
      })).catch(() => [])
    ]);

    // --- Processamento ---

    // 1. Contagens
    const totalAtendimentos = Array.isArray(atendimentosCount) && atendimentosCount[0]?.count 
      ? Number(atendimentosCount[0].count) 
      : 0;

    const mulheresAtivas = Array.isArray(rawMatriculas) 
      ? rawMatriculas.filter((m: any) => {
          const s = String(m.status || '').toLowerCase();
          return ['ativa', 'ativo', 'cursando', 'matriculada'].includes(s);
        }).length
      : 0;

    // 2. Processar Gráfico (Agrupar por Dia)
    const chartMap = new Map<string, number>();
    if (Array.isArray(atendimentosGrafico)) {
      atendimentosGrafico.forEach((item: any) => {
        if (item.data_abertura) {
          const dateKey = item.data_abertura.split('T')[0]; // YYYY-MM-DD
          chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + 1);
        }
      });
    }
    
    // Ordenar array do gráfico
    const atendimentosPorDia = Array.from(chartMap, ([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // 3. Mapear Eventos
    const eventosFormatados = Array.isArray(proximosEventos) 
      ? proximosEventos.map((evt: any) => ({
          id: evt.id,
          titulo: evt.nome,
          data_inicio: evt.data_inicio,
          tipo_id: evt.tipo_id ? { nome: evt.tipo_id.nome } : undefined
        }))
      : [];

    return {
      kpis: {
        totalAtendimentosMes: totalAtendimentos,
        novosCasos: totalAtendimentos, // Simplificação para demo
        mulheresAcompanhamento: mulheresAtivas,
        demandaReprimida: 0 // Placeholder
      },
      atendimentosPorDia,
      proximosEventos: eventosFormatados,
      alertasMedidasProtetivas: []
    };

  } catch (error) {
    console.error("❌ Erro ao gerar dashboard stats:", error);
    return {
      kpis: { totalAtendimentosMes: 0, novosCasos: 0, mulheresAcompanhamento: 0, demandaReprimida: 0 },
      atendimentosPorDia: [],
      proximosEventos: [],
      alertasMedidasProtetivas: []
    };
  }
}
