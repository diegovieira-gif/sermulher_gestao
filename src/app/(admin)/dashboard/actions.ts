"use server";

import { directus } from "@/lib/directus";
import { readItems, aggregate } from "@directus/sdk";

export type DashboardStats = {
  atendimentosMes: number;
  alunasAtivas: number;
  turmasAbertas: number;
  proximoEvento: {
    nome: string;
    data: string;
    local: string;
  } | null;
  chartData: Array<{ name: string; total: number }>;
};

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

  try {
    const [atendimentosCount, atendimentosGrafico, rawMatriculas, turmasCount, proximosEventos] = await Promise.all([
      
      // A. Contagem Atendimentos (Mês Atual)
      directus.request(aggregate('atendimentos', {
        aggregate: { count: '*' },
        query: {
          filter: { data_abertura: { _between: [startOfMonth, endOfMonth] } }
        }
      })),

      // B. Gráfico (Últimos 6 meses)
      directus.request(readItems('atendimentos', {
        filter: { data_abertura: { _gte: sixMonthsAgoStr } },
        fields: ['data_abertura'],
        limit: -1, 
        sort: ['data_abertura']
      })),

      // C. Alunas Ativas (Busca lista para filtrar no código)
      directus.request(readItems('escola_matriculas', {
        fields: ['status'],
        limit: -1 
      })).catch(() => []),

      // D. Turmas Abertas
      directus.request(aggregate('escola_turmas', {
        aggregate: { count: '*' },
        query: {
          filter: { status: { _in: ['aberta', 'em_andamento', 'Em Andamento'] } }
        }
      })).catch(() => [{ count: 0 }]),

      // E. Próximo Evento
      directus.request(readItems('eventos_campanhas', {
        filter: {
          data_inicio: { _gte: now.toISOString().split('T')[0] },
          status: { _neq: 'cancelado' }
        },
        fields: ['nome', 'data_inicio', 'local', 'tipo_id.nome'],
        sort: ['data_inicio'],
        limit: 1
      })).catch(() => [])
    ]);

    // --- Processamento ---

    // 1. Contagem Manual de Alunas (Correção aplicada: 'ativa')
    const alunasAtivasCount = Array.isArray(rawMatriculas) 
      ? rawMatriculas.filter((m: any) => {
          const s = m.status ? String(m.status).toLowerCase() : '';
          // Aceita variações comuns
          return ['ativa', 'ativo', 'cursando', 'matriculada'].includes(s);
        }).length
      : 0;

    // 2. Extrair contagem do aggregate
    const getCount = (result: any) => {
      if (Array.isArray(result) && result[0] && result[0].count) {
        return Number(result[0].count);
      }
      return 0;
    };

    // 3. Processar Gráfico
    const chartMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString('pt-BR', { month: 'short' }); 
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      chartMap.set(capitalizedKey, 0);
    }

    if (atendimentosGrafico && Array.isArray(atendimentosGrafico)) {
      atendimentosGrafico.forEach((item: any) => {
        if (item.data_abertura) {
          const date = new Date(item.data_abertura);
          const key = date.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }); 
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
          if (chartMap.has(capitalizedKey)) {
            chartMap.set(capitalizedKey, chartMap.get(capitalizedKey) + 1);
          }
        }
      });
    }
    const chartData = Array.from(chartMap, ([name, total]) => ({ name, total }));

    // 4. Formatar Próximo Evento
    const nextEvent = proximosEventos && proximosEventos[0] ? {
      nome: proximosEventos[0].nome,
      data: new Date(proximosEventos[0].data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }),
      local: proximosEventos[0].local || 'Local a definir'
    } : null;

    return {
      atendimentosMes: getCount(atendimentosCount),
      alunasAtivas: alunasAtivasCount,
      turmasAbertas: getCount(turmasCount),
      proximoEvento: nextEvent,
      chartData
    };

  } catch (error) {
    console.error("❌ Erro no Dashboard:", error);
    return {
      atendimentosMes: 0,
      alunasAtivas: 0,
      turmasAbertas: 0,
      proximoEvento: null,
      chartData: []
    };
  }
}
