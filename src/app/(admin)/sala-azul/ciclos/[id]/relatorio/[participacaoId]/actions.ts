"use server";

import { directus } from "@/lib/directus";
import { readItems, readItem } from "@directus/sdk";

/**
 * Busca dados completos para o Relatório Individual de Frequência
 */
export async function getRelatorioIndividual(
  cicloId: string | number,
  participacaoId: string | number
) {
  try {
    const cicloIdNum = typeof cicloId === "string" ? parseInt(cicloId, 10) : cicloId;
    const participacaoIdNum =
      typeof participacaoId === "string" ? parseInt(participacaoId, 10) : participacaoId;

    if (isNaN(cicloIdNum) || isNaN(participacaoIdNum)) {
      return {
        success: false,
        error: "IDs inválidos",
      };
    }

    // 1. Busca dados do Ciclo (Sala Azul)
    const ciclo = await directus.request(
      readItem("salas_azul", cicloIdNum, {
        fields: [
          "id",
          "nome_ciclo",
          "data_inicio",
          "data_termino",
          "local_id.id",
          "local_id.nome",
          "responsavel_tecnico.id",
          "responsavel_tecnico.first_name",
          "responsavel_tecnico.last_name",
        ],
      })
    );

    // 2. Busca dados da Participação e do Infrator
    const participacao = await directus.request(
      readItem("participacoes_sala_azul", participacaoIdNum, {
        fields: [
          "id",
          "infrator.id",
          "infrator.nome_completo",
          "infrator.cpf",
          "infrator.numero_processo",
        ],
      })
    );

    // Verifica se a participação pertence ao ciclo correto
    const participacaoFull = await directus.request(
      readItem("participacoes_sala_azul", participacaoIdNum, {
        fields: ["sala"],
      })
    );

    if (participacaoFull.sala !== cicloIdNum) {
      return {
        success: false,
        error: "Participação não pertence a este ciclo",
      };
    }

    // 3. Busca todas as Sessões do Ciclo (ordenadas por data)
    const sessoes = await directus.request(
      readItems("ciclo_sessoes", {
        fields: ["id", "data", "tema", "relatorio"],
        filter: {
          sala_id: {
            _eq: cicloIdNum,
          },
        },
        sort: ["data"],
      })
    );

    // 4. Busca todas as Presenças desta Participação
    const presencas = await directus.request(
      readItems("sessoes_presenca", {
        fields: ["sessao_id", "presente"],
        filter: {
          participacao_id: {
            _eq: participacaoIdNum,
          },
        },
      })
    );

    // 5. Processa os dados no JS: Cruza Sessões com Presenças
    const sessoesComPresenca = sessoes.map((sessao) => {
      const presenca = presencas.find((p) => p.sessao_id === sessao.id);
      return {
        id: sessao.id,
        data: sessao.data,
        tema: sessao.tema || "-",
        presente: presenca ? presenca.presente === true : false,
      };
    });

    // 6. Calcula estatísticas
    const totalSessoes = sessoesComPresenca.length;
    const qtdPresente = sessoesComPresenca.filter((s) => s.presente).length;
    const qtdAusente = totalSessoes - qtdPresente;
    const percentualFrequencia =
      totalSessoes > 0 ? Math.round((qtdPresente / totalSessoes) * 100) : 0;

    return {
      success: true,
      data: {
        ciclo: {
          id: ciclo.id,
          nome: ciclo.nome_ciclo || "-",
          data_inicio: ciclo.data_inicio || null,
          data_fim: ciclo.data_termino || null,
          local: ciclo.local_id?.nome || "-",
          responsavel: ciclo.responsavel_tecnico
            ? `${ciclo.responsavel_tecnico.first_name || ""} ${
                ciclo.responsavel_tecnico.last_name || ""
              }`.trim()
            : "-",
        },
        participante: {
          id: participacao.infrator?.id,
          nome: participacao.infrator?.nome_completo || "-",
          cpf: participacao.infrator?.cpf || "-",
          numero_processo: participacao.infrator?.numero_processo || "-",
        },
        sessoes: sessoesComPresenca,
        resumo: {
          totalSessoes,
          qtdPresente,
          qtdAusente,
          percentualFrequencia,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao buscar dados do relatório:", error);
    return {
      success: false,
      error: "Erro ao buscar dados do relatório. Tente novamente.",
    };
  }
}
