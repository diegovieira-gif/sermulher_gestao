"use server";

import { directus } from "@/lib/directus";
import { readItems, readItem } from "@directus/sdk";

/**
 * Busca o histórico de participações de um infrator em ciclos
 */
export async function getInfratorHistory(infratorId: number) {
  try {
    // Busca todas as participações do infrator
    const participacoes = await directus.request(
      readItems("participacoes_sala_azul", {
        fields: [
          "id",
          "frequencia_percentual",
          "status_participacao",
          "sala.id",
          "sala.nome_ciclo",
          "sala.data_inicio",
          "sala.data_termino",
          "sala.status",
        ],
        filter: {
          infrator: {
            _eq: infratorId,
          },
        },
        sort: ["-sala.data_inicio"], // Mais recentes primeiro
      })
    );

    // Para cada participação, calcula a frequência real baseada nas presenças
    const historicoComFrequencia = await Promise.all(
      participacoes.map(async (participacao: any) => {
        // Busca todas as sessões do ciclo
        const sessoes = await directus.request(
          readItems("ciclo_sessoes", {
            fields: ["id"],
            filter: {
              sala_id: {
                _eq: participacao.sala?.id,
              },
            },
          })
        );

        // Busca todas as presenças desta participação
        const presencas = await directus.request(
          readItems("sessoes_presenca", {
            fields: ["presente"],
            filter: {
              participacao_id: {
                _eq: participacao.id,
              },
            },
          })
        );

        // Calcula frequência real
        const totalSessoes = sessoes.length;
        const presencasCount = presencas.filter(
          (p: any) => p.presente === true
        ).length;
        const frequenciaCalculada =
          totalSessoes > 0
            ? Math.round((presencasCount / totalSessoes) * 100)
            : participacao.frequencia_percentual || 0;

        return {
          participacao_id: participacao.id,
          sala_id: participacao.sala?.id,
          nome_ciclo: participacao.sala?.nome_ciclo || "Ciclo sem nome",
          data_inicio: participacao.sala?.data_inicio || null,
          data_termino: participacao.sala?.data_termino || null,
          status_ciclo: participacao.sala?.status || "Desconhecido",
          status_participacao: participacao.status_participacao || "Cursando",
          frequencia_percentual: frequenciaCalculada,
          total_sessoes: totalSessoes,
          presencas: presencasCount,
        };
      })
    );

    return {
      success: true,
      data: historicoComFrequencia,
    };
  } catch (error) {
    console.error("Erro ao buscar histórico do infrator:", error);
    return {
      success: false,
      error: "Erro ao buscar histórico. Tente novamente.",
      data: [],
    };
  }
}

/**
 * Busca os dados completos de um infrator
 */
export async function getInfratorById(id: number) {
  try {
    const infrator = await directus.request(
      readItem("infratores", id, {
        fields: [
          "*",
          "nivel_id.id",
          "nivel_id.nome",
          "nivel_id.cor",
          "status_legal_id.id",
          "status_legal_id.nome",
        ],
      })
    );

    return {
      success: true,
      data: infrator,
    };
  } catch (error) {
    console.error("Erro ao buscar infrator:", error);
    return {
      success: false,
      error: "Erro ao buscar dados do infrator.",
    };
  }
}
