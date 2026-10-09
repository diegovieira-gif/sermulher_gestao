"use server";

import { redirect } from "next/navigation";
import { getDirectusClient } from "@/lib/directus";
import { readItems, aggregate } from "@directus/sdk";
import {
  dataEmBrasilia,
  hojeEmBrasilia,
  limitesDoMes,
  mesAtualEmBrasilia,
} from "@/lib/datas";
import { filtroMesDateTime } from "../relatorios/calculos";

// Indicadores (KPIs) exibidos como cards no Dashboard
export type DashboardIndicadores = {
  // Visão geral
  totalBeneficiarias: number;
  atendimentosMes: number;
  eventosProximos: number;
  demandasAbertas: number;
  // Perfil das beneficiárias
  comMedidaProtetiva: number;
  bolsaFamilia: number;
  bpc: number;
  comFilhos: number;
  // Escola da Mulher
  turmasAtivas: number;
  alunasMatriculadas: number;
  cursosDisponiveis: number;
  // Sala Azul & Encaminhamentos
  infratores: number;
  ciclosReflexivos: number;
  encaminhamentosMes: number;
  beneficiosMes: number;
};

// Tipo de retorno para o Dashboard
export type DashboardStats = {
  kpis: {
    totalAtendimentosMes: number;
    novosCasos: number;
    mulheresAcompanhamento: number;
    demandaReprimida: number;
  };
  indicadores: DashboardIndicadores;
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

/** Mês/ano de referência para os indicadores mensais do dashboard. */
export type PeriodoDashboard = { mes: number; ano: number };

export async function getDashboardStats(periodo?: PeriodoDashboard): Promise<{
  success: boolean;
  data?: DashboardStats;
  error?: string;
}> {
  const directus = await getDirectusClient({ requireAuth: true });

  // Configuração de datas — sempre no calendário de Brasília. Em UTC, das 21h
  // em diante "hoje" e "mês atual" já eram o dia/mês seguinte.
  const hoje = hojeEmBrasilia();
  const atual = mesAtualEmBrasilia();

  // Eventos de hoje em diante. `data_inicio` é `dateTime` (hora de parede):
  // compara com 00:00 de hoje sem fuso.
  const todayStr = `${hoje}T00:00:00`;

  // Período de referência: mês corrente por padrão, ou o mês/ano escolhido no
  // seletor do dashboard — permite responder "e em junho, como foi?".
  const mesSel =
    periodo && periodo.mes >= 1 && periodo.mes <= 12
      ? periodo.mes
      : atual.mes;
  const anoSel =
    periodo && periodo.ano >= 2000 && periodo.ano <= 2100
      ? periodo.ano
      : atual.ano;
  const mesCorrente = mesSel === atual.mes && anoSel === atual.ano;

  // Campos `date` (data_entrega) usam dia 1..último dia; campos `dateTime`
  // (data_abertura, data_recebimento) usam _gte/_lt — com _between até
  // "último dia 00:00" o último dia do mês ficava de fora.
  const { inicio: startOfMonth, fim: endOfMonth } = limitesDoMes(anoSel, mesSel);
  const mesDateTime = filtroMesDateTime(anoSel, mesSel);

  // Gráfico: últimos 30 dias no mês corrente; o mês inteiro quando é um
  // período passado escolhido no seletor.
  const inicio30Dias = dataEmBrasilia(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const filtroGrafico = mesCorrente
    ? { _gte: `${inicio30Dias}T00:00:00`, _lte: `${hoje}T23:59:59` }
    : mesDateTime;

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
            filter: { data_abertura: mesDateTime },
          },
        }),
      ),

      // B. Gráfico: Atendimentos recentes
      // @ts-ignore
      directus.request(
        readItems("atendimentos", {
          filter: {
            data_abertura: filtroGrafico,
          },
          fields: ["data_abertura"],
          limit: -1,
          sort: ["data_abertura"],
        }),
      ),

      // C. KPI: Alunas Ativas (Escola)
      // @ts-ignore
      directus.request(
        readItems("escola_matriculas", {
          fields: ["status"],
          filter: {
            status: { _in: ["ativa", "cursando", "matriculada", "aprovada"] },
          },
          limit: -1,
        }),
      ),

      // D. Lista: Próximos Eventos
      // @ts-ignore
      directus.request(
        readItems("eventos_campanhas", {
          filter: {
            data_inicio: { _gte: todayStr },
          },
          // REMOVIDO "local" para evitar erro 403
          fields: ["id", "nome", "data_inicio", "tipo_id.nome"],
          sort: ["data_inicio"],
          limit: 5,
        }),
      ),

      // E. KPI: Infratores
      directus.request(
        aggregate("infratores", {
          aggregate: { count: "*" },
        }),
      ),
    ]);

    // --- Processamento ---

    const totalAtendimentos =
      Array.isArray(atendimentosCount) && atendimentosCount[0]?.count
        ? Number(atendimentosCount[0].count)
        : 0;

    const totalInfratores =
      Array.isArray(infratoresCount) && infratoresCount[0]?.count
        ? Number(infratoresCount[0].count)
        : 0;

    const totalAlunas = Array.isArray(rawMatriculas) ? rawMatriculas.length : 0;

    // Processar Gráfico
    const chartMap = new Map<string, number>();
    if (Array.isArray(atendimentosGrafico)) {
      atendimentosGrafico.forEach((item: any) => {
        if (item.data_abertura) {
          const dateKey = item.data_abertura.split("T")[0];
          chartMap.set(dateKey, (chartMap.get(dateKey) || 0) + 1);
        }
      });
    }

    const atendimentosPorDia = Array.from(chartMap, ([data, quantidade]) => ({
      data,
      quantidade,
    })).sort((a, b) => a.data.localeCompare(b.data));

    // Mapear Eventos
    const eventosFormatados = Array.isArray(proximosEventos)
      ? proximosEventos.map((evt: any) => ({
          id: evt.id,
          titulo: evt.nome,
          data_inicio: evt.data_inicio,
          tipo_id: evt.tipo_id ? { nome: evt.tipo_id.nome } : undefined,
        }))
      : [];

    // --- Indicadores adicionais (cards) ---
    // Helper resiliente: conta itens de uma coleção (com filtro opcional).
    // Qualquer falha individual resulta em 0, sem quebrar o dashboard.
    const countOf = async (
      collection: string,
      filter?: Record<string, unknown>,
    ): Promise<number> => {
      const res = await directus.request(
        aggregate(collection, {
          aggregate: { count: "*" },
          ...(filter ? { query: { filter } } : {}),
        }),
      );
      return Array.isArray(res) && res[0]?.count ? Number(res[0].count) : 0;
    };

    const monthRange = { _between: [startOfMonth, endOfMonth] };
    // "Finalizada" (ciclo da Sala Azul) e "Arquivado" (demanda) também
    // encerram: sem eles, ciclos terminados contavam como ativos e demandas
    // arquivadas como abertas.
    const statusConcluido = [
      "Finalizado",
      "Finalizada",
      "Arquivado",
      "Concluído",
      "Concluido",
      "Cancelado",
      "concluida",
      "concluido",
      "encerrado",
      "finalizado",
      "cancelada",
    ];
    // Status vazio = ainda em aberto (o Kanban mostra como "Aguardando").
    // `_nin` sozinho descarta o NULL no SQL, então ele entra pelo `_or`.
    const emAberto = (campo: string) => ({
      _or: [
        { [campo]: { _nin: statusConcluido } },
        { [campo]: { _null: true } },
      ],
    });

    const indicadorDefs: Array<[keyof DashboardIndicadores, Promise<number>]> = [
      ["totalBeneficiarias", countOf("beneficiarias")],
      ["atendimentosMes", Promise.resolve(totalAtendimentos)],
      ["eventosProximos", Promise.resolve(eventosFormatados.length)],
      [
        "demandasAbertas",
        countOf("tramitacoes", emAberto("status_etapa")),
      ],
      [
        "comMedidaProtetiva",
        countOf("beneficiarias", { possui_medida_protetiva: { _eq: true } }),
      ],
      [
        "bolsaFamilia",
        countOf("beneficiarias", { recebe_bolsa_familia: { _eq: true } }),
      ],
      ["bpc", countOf("beneficiarias", { recebe_bpc: { _eq: true } })],
      ["comFilhos", countOf("beneficiarias", { quantidade_filhos: { _gt: 0 } })],
      [
        "turmasAtivas",
        countOf("escola_turmas", emAberto("status")),
      ],
      ["alunasMatriculadas", Promise.resolve(totalAlunas)],
      ["cursosDisponiveis", countOf("escola_cursos")],
      ["infratores", Promise.resolve(totalInfratores)],
      [
        "ciclosReflexivos",
        countOf("salas_azul", emAberto("status")),
      ],
      [
        "encaminhamentosMes",
        countOf("tramitacoes", { data_recebimento: mesDateTime }),
      ],
      [
        "beneficiosMes",
        countOf("entregas_beneficios", { data_entrega: monthRange }),
      ],
    ];

    const settled = await Promise.allSettled(indicadorDefs.map(([, p]) => p));
    const indicadores = {} as DashboardIndicadores;
    indicadorDefs.forEach(([key], i) => {
      const r = settled[i];
      indicadores[key] = r.status === "fulfilled" ? r.value : 0;
    });

    const stats: DashboardStats = {
      kpis: {
        totalAtendimentosMes: totalAtendimentos,
        novosCasos: totalAtendimentos,
        mulheresAcompanhamento: totalAlunas,
        demandaReprimida: indicadores.demandasAbertas,
      },
      indicadores,
      atendimentosPorDia,
      proximosEventos: eventosFormatados,
      alertasMedidasProtetivas: [],
      totalAtendimentos,
      totalAlunas,
      totalInfratores,
      growthAtendimentos: "+0%",
      growthAlunas: "+0%",
      growthInfratores: "+0%",
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error: any) {
    const isUnauthorized =
      error?.response?.status === 401 ||
      error?.status === 401 ||
      error?.message?.includes("Authentication required") ||
      error?.message?.includes("Invalid user credentials") ||
      error?.errors?.some?.(
        (e: any) =>
          e?.extensions?.code === "INVALID_CREDENTIALS" ||
          e?.extensions?.code === "TOKEN_EXPIRED",
      );

    if (isUnauthorized) {
      redirect("/login?error=unauthorized");
    }

    // Preserva o throw se o next.js já estiver gerenciando o redirect
    if (error?.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("❌ Erro em chamadas do Dashboard (Safe Fetch):", error);

    // Retornando estado zero/vazio de forma robusta e mantendo a tipagem esperada
    return {
      success: false,
      data: {
        kpis: {
          totalAtendimentosMes: 0,
          novosCasos: 0,
          mulheresAcompanhamento: 0,
          demandaReprimida: 0,
        },
        indicadores: {
          totalBeneficiarias: 0,
          atendimentosMes: 0,
          eventosProximos: 0,
          demandasAbertas: 0,
          comMedidaProtetiva: 0,
          bolsaFamilia: 0,
          bpc: 0,
          comFilhos: 0,
          turmasAtivas: 0,
          alunasMatriculadas: 0,
          cursosDisponiveis: 0,
          infratores: 0,
          ciclosReflexivos: 0,
          encaminhamentosMes: 0,
          beneficiosMes: 0,
        },
        atendimentosPorDia: [],
        proximosEventos: [],
        alertasMedidasProtetivas: [],
        totalAtendimentos: 0,
        totalAlunas: 0,
        totalInfratores: 0,
        growthAtendimentos: "+0%",
        growthAlunas: "+0%",
        growthInfratores: "+0%",
      },
      error:
        "Houve um problema ao carregar os dados. Exibindo dashboard limpo.",
    };
  }
}
