"use server";

import { directus } from "@/lib/directus";
import { readItems, aggregate } from "@directus/sdk";

// ======= TIPOS UNIFICADOS DO DASHBOARD =======

export type UnifiedDashboardStats = {
  // KPIs de Atendimentos (RMA)
  atendimentos: {
    totalMes: number;
    evolucaoMeses: Array<{ name: string; total: number }>;
  };
  // KPIs da Escola da Mulher
  escola: {
    alunasCursando: number;
    turmasAbertas: number;
  };
  // KPIs da Agenda
  agenda: {
    proximoEvento: {
      data: string;
      titulo: string;
      local?: string;
    } | null;
    eventosMes: number;
  };
};

// ======= TIPOS LEGADOS (mantidos para compatibilidade) =======

export type KPIData = {
  totalAtendimentosMes: number;
  novosCasos: number;
  demandaReprimida: number;
  mulheresAcompanhamento: number;
};

export type EventoAgenda = {
  id: number;
  data_inicio: string;
  data_fim?: string;
  titulo: string;
  tipo_id?: {
    nome: string;
    icone?: string;
  };
  descricao?: string;
};

export type AtendimentoDia = {
  data: string;
  quantidade: number;
};

export type BeneficiariaMedidaProtetiva = {
  id: number;
  nome_completo: string;
  data_criacao: string;
  possui_medida_protetiva: boolean;
};

export type DashboardStats = {
  kpis: KPIData;
  atendimentosPorDia: AtendimentoDia[];
  proximosEventos: EventoAgenda[];
  alertasMedidasProtetivas: BeneficiariaMedidaProtetiva[];
};

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

// ======= NOVA FUNÇÃO AGREGADORA UNIFICADA =======

/**
 * Função principal que agrega estatísticas de TODOS os módulos do sistema.
 * Retorna dados otimizados para o Dashboard Unificado com KPIs visuais.
 */
export async function getUnifiedDashboardStats(): Promise<
  | { success: true; data: UnifiedDashboardStats }
  | { success: false; error: string }
> {
  try {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // Calcula os últimos 6 meses (incluindo o atual)
    const mesesParaGrafico = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1);
      mesesParaGrafico.push({
        inicio: new Date(data.getFullYear(), data.getMonth(), 1).toISOString().split("T")[0],
        fim: new Date(data.getFullYear(), data.getMonth() + 1, 0).toISOString().split("T")[0],
        nome: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      });
    }

    // Mês atual para filtro
    const inicioMesAtual = new Date(anoAtual, mesAtual, 1).toISOString().split("T")[0];
    const fimMesAtual = new Date(anoAtual, mesAtual + 1, 0).toISOString().split("T")[0];

    // === PARALELIZAÇÃO TOTAL: Busca TODOS os dados simultaneamente ===
    const [
      // 1. Atendimentos do Mês Atual
      atendimentosMesAtual,
      // 2. Atendimentos dos últimos 6 meses (para gráfico)
      ...atendimentosPorMes
    ] = await Promise.all([
      // Total de atendimentos no mês atual
      directus.request(
        readItems("atendimentos", {
          filter: {
            data_abertura: {
              _gte: inicioMesAtual,
              _lte: fimMesAtual,
            },
          },
          limit: 0,
          meta: "filter_count",
        })
      ).catch(() => ({ meta: { filter_count: 0 } })),
      
      // Para cada um dos 6 meses, busca a contagem
      ...mesesParaGrafico.map((mes) =>
        directus.request(
          readItems("atendimentos", {
            filter: {
              data_abertura: {
                _gte: mes.inicio,
                _lte: mes.fim,
              },
            },
            limit: 0,
            meta: "filter_count",
          })
        ).catch(() => ({ meta: { filter_count: 0 } }))
      ),
    ]);

    // === BUSCA DADOS DA ESCOLA E EVENTOS EM PARALELO ===
    const [matriculasAtivas, turmasAbertas, proximoEvento, eventosDoMes] = await Promise.all([
      // Total de alunas matriculadas com status 'cursando'
      directus.request(
        readItems("escola_matriculas", {
          filter: {
            status: { _eq: "cursando" },
          },
          limit: 0,
          meta: "filter_count",
        })
      ).catch(() => ({ meta: { filter_count: 0 } })),

      // Total de turmas em andamento (sem data de fim ou data de fim futura)
      directus.request(
        readItems("escola_turmas", {
          filter: {
            _or: [
              { data_fim: { _null: true } },
              { data_fim: { _gte: new Date().toISOString().split("T")[0] } },
            ],
          },
          limit: 0,
          meta: "filter_count",
        })
      ).catch(() => ({ meta: { filter_count: 0 } })),

      // Próximo evento (1 único evento mais próximo)
      directus.request(
        readItems("eventos_campanhas", {
          fields: ["id", "data_inicio", "titulo", "local_id.nome"],
          filter: {
            data_inicio: { _gte: new Date().toISOString().split("T")[0] },
          },
          sort: ["data_inicio"],
          limit: 1,
        })
      ).catch(() => []),

      // Eventos planejados para o mês atual
      directus.request(
        readItems("eventos_campanhas", {
          filter: {
            data_inicio: {
              _gte: inicioMesAtual,
              _lte: fimMesAtual,
            },
          },
          limit: 0,
          meta: "filter_count",
        })
      ).catch(() => ({ meta: { filter_count: 0 } })),
    ]);

    // === PROCESSAMENTO DOS RESULTADOS ===

    // 1. Atendimentos
    const totalAtendimentosMes = (atendimentosMesAtual as any)?.meta?.filter_count || 0;
    
    const evolucaoMeses = mesesParaGrafico.map((mes, index) => ({
      name: mes.nome.charAt(0).toUpperCase() + mes.nome.slice(1), // Capitaliza primeira letra
      total: (atendimentosPorMes[index] as any)?.meta?.filter_count || 0,
    }));

    // 2. Escola
    const alunasCursando = (matriculasAtivas as any)?.meta?.filter_count || 0;
    const turmasAbertasTotal = (turmasAbertas as any)?.meta?.filter_count || 0;

    // 3. Agenda
    const eventoArray = proximoEvento as any[];
    const proximoEventoObj = eventoArray.length > 0 ? {
      data: eventoArray[0].data_inicio,
      titulo: eventoArray[0].titulo,
      local: eventoArray[0].local_id?.nome,
    } : null;

    const eventosMesTotal = (eventosDoMes as any)?.meta?.filter_count || 0;

    // === MONTAGEM DO RESULTADO FINAL ===
    return {
      success: true,
      data: {
        atendimentos: {
          totalMes: totalAtendimentosMes,
          evolucaoMeses,
        },
        escola: {
          alunasCursando,
          turmasAbertas: turmasAbertasTotal,
        },
        agenda: {
          proximoEvento: proximoEventoObj,
          eventosMes: eventosMesTotal,
        },
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro ao buscar Dashboard Unificado:", errorMessage);
    console.error("Detalhes:", error);
    return {
      success: false,
      error: `Não foi possível carregar os dados: ${errorMessage}`,
    };
  }
}

// ======= FUNÇÕES LEGADAS (mantidas para compatibilidade) =======

export async function getDashboardStats(): Promise<
  | { success: true; data: DashboardStats }
  | { success: false; error: string }
> {
  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const proximosDias = new Date(hoje);
    proximosDias.setDate(proximosDias.getDate() + 7);
    
    const ultimaSemana = new Date(hoje);
    ultimaSemana.setDate(ultimaSemana.getDate() - 7);
    
    const ultimos15Dias = new Date(hoje);
    ultimos15Dias.setDate(ultimos15Dias.getDate() - 15);

    // Busca todas as queries em paralelo
    const [
      atendimentosMesResult,
      atendimentosAguardandoResult,
      beneficiariasResult,
      eventosResult,
      medidasProtetivasResult,
      atendimentosUltimos15Result,
    ] = await Promise.all([
      // Total de atendimentos no mês atual
      directus
        .request(
          readItems("atendimentos", {
            fields: ["id"],
            filter: {
              data_abertura: {
                _gte: inicioMes.toISOString().split("T")[0],
                _lte: fimMes.toISOString().split("T")[0],
              },
            },
            limit: -1,
          })
        )
        .catch(() => []),

      // Atendimentos aguardando (demanda reprimida)
      directus
        .request(
          readItems("atendimentos", {
            fields: ["id"],
            filter: {
              status: {
                _eq: "Aguardando",
              },
            },
            limit: -1,
          })
        )
        .catch(() => []),

      // Total de beneficiárias
      directus
        .request(
          readItems("beneficiarias", {
            fields: ["id"],
            limit: -1,
          })
        )
        .catch(() => []),

      // Próximos eventos (7 dias)
      directus
        .request(
          readItems("eventos_campanhas", {
            fields: [
              "id",
              "data_inicio",
              "data_fim",
              "titulo",
              "descricao",
              "tipo_id.nome",
              "tipo_id.icone",
            ],
            filter: {
              data_inicio: {
                _gte: hoje.toISOString().split("T")[0],
                _lte: proximosDias.toISOString().split("T")[0],
              },
            },
            sort: ["data_inicio"],
            limit: -1,
          })
        )
        .catch(() => []),

      // Beneficiárias com medida protetiva (últimos 7 dias)
      directus
        .request(
          readItems("beneficiarias", {
            fields: ["id", "nome_completo", "date_created", "possui_medida_protetiva"],
            filter: {
              possui_medida_protetiva: {
                _eq: true,
              },
              date_created: {
                _gte: ultimaSemana.toISOString(),
              },
            },
            sort: ["-date_created"],
            limit: -1,
          })
        )
        .catch(() => []),

      // Atendimentos dos últimos 15 dias (para gráfico)
      directus
        .request(
          readItems("atendimentos", {
            fields: ["id", "data_abertura"],
            filter: {
              data_abertura: {
                _gte: ultimos15Dias.toISOString().split("T")[0],
                _lte: hoje.toISOString().split("T")[0],
              },
            },
            limit: -1,
          })
        )
        .catch(() => []),
    ]);

    // Processa dados para os KPIs
    const kpis: KPIData = {
      totalAtendimentosMes: (atendimentosMesResult as any[]).length,
      novosCasos: (atendimentosMesResult as any[]).filter(
        (a: any) => new Date(a.data_abertura).getTime() >= ultimos15Dias.getTime()
      ).length,
      demandaReprimida: (atendimentosAguardandoResult as any[]).length,
      mulheresAcompanhamento: (beneficiariasResult as any[]).length,
    };

    // Processa eventos para a agenda
    const proximosEventos: EventoAgenda[] = (eventosResult as any[]).map((evento: any) => ({
      id: evento.id,
      data_inicio: evento.data_inicio,
      data_fim: evento.data_fim,
      titulo: evento.titulo,
      tipo_id: evento.tipo_id
        ? {
            nome: evento.tipo_id.nome,
            icone: evento.tipo_id.icone,
          }
        : undefined,
      descricao: evento.descricao,
    }));

    // Processa atendimentos para gráfico (agrupa por dia)
    const atendimentosPorDiaMap = new Map<string, number>();
    
    for (let i = 15; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = data.toISOString().split("T")[0];
      atendimentosPorDiaMap.set(dataStr, 0);
    }

    (atendimentosUltimos15Result as any[]).forEach((atendimento: any) => {
      const dataStr = atendimento.data_abertura.split("T")[0];
      if (atendimentosPorDiaMap.has(dataStr)) {
        atendimentosPorDiaMap.set(dataStr, (atendimentosPorDiaMap.get(dataStr) || 0) + 1);
      }
    });

    const atendimentosPorDia: AtendimentoDia[] = Array.from(atendimentosPorDiaMap).map(
      ([data, quantidade]) => ({
        data,
        quantidade,
      })
    );

    // Processa alertas de medidas protetivas
    const alertasMedidasProtetivas: BeneficiariaMedidaProtetiva[] = (medidasProtetivasResult as any[]).map(
      (beneficiaria: any) => ({
        id: beneficiaria.id,
        nome_completo: beneficiaria.nome_completo,
        data_criacao: beneficiaria.date_created,
        possui_medida_protetiva: beneficiaria.possui_medida_protetiva,
      })
    );

    return {
      success: true,
      data: {
        kpis,
        atendimentosPorDia,
        proximosEventos,
        alertasMedidasProtetivas,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro ao buscar dashboard stats:", errorMessage);
    return {
      success: false,
      error: `Erro ao carregar dados do dashboard: ${errorMessage}`,
    };
  }
}

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
