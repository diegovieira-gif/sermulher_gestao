"use server";

import { directus } from "@/lib/directus";
import { readItems, readItem } from "@directus/sdk";
import { assertAccess } from "@/lib/permissions";
import { frequenciasPorParticipacao } from "@/lib/frequencia";

/**
 * Busca o histórico de participações de um infrator em ciclos
 */
export async function getInfratorHistory(infratorId: number) {
  await assertAccess("sala-azul");
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
        limit: -1,
      })
    );

    // Mesma conta da lista do ciclo e do relatório ao Judiciário
    // (frequenciasPorParticipacao): presença de sessão excluída não conta.
    // A conta própria que havia aqui somava essas presenças e passava de 100%.
    const salaIds = [
      ...new Set(participacoes.map((p: any) => Number(p.sala?.id)).filter((n) => n > 0)),
    ];
    const participacaoIds = participacoes.map((p: any) => Number(p.id));
    const [sessoes, registros] = await Promise.all([
      salaIds.length
        ? directus.request(
            readItems("ciclo_sessoes", {
              fields: ["id", "sala_id"],
              filter: { sala_id: { _in: salaIds } },
              limit: -1,
            })
          )
        : Promise.resolve([]),
      participacaoIds.length
        ? directus.request(
            readItems("sessoes_presenca", {
              fields: ["sessao_id", "participacao_id", "presente"],
              filter: { participacao_id: { _in: participacaoIds } },
              limit: -1,
            })
          )
        : Promise.resolve([]),
    ]);

    const historicoComFrequencia = participacoes.map((participacao: any) => {
      const sessaoIds = (sessoes as Array<Record<string, unknown>>)
        .filter((s) => Number(s.sala_id) === Number(participacao.sala?.id))
        .map((s) => Number(s.id));
      const frequencia = frequenciasPorParticipacao(
        sessaoIds,
        registros as Array<Record<string, unknown>>,
        [Number(participacao.id)]
      ).get(Number(participacao.id));

      return {
        participacao_id: participacao.id,
        sala_id: participacao.sala?.id,
        nome_ciclo: participacao.sala?.nome_ciclo || "Ciclo sem nome",
        data_inicio: participacao.sala?.data_inicio || null,
        data_termino: participacao.sala?.data_termino || null,
        status_ciclo: participacao.sala?.status || "Desconhecido",
        status_participacao: participacao.status_participacao || "Cursando",
        frequencia_percentual: frequencia?.percentual ?? 0,
        total_sessoes: frequencia?.totalSessoes ?? 0,
        presencas: frequencia?.presencas ?? 0,
      };
    });

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
  await assertAccess("sala-azul");
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
          // M2M em dois níveis (ver sincronizarTiposAgressao em ../actions):
          // só assim chega o id do tipo, e não o da linha de junção.
          "tipos_agressao_lista.infratores_tipos_agressao_id.tipo_agressao_id",
        ],
      })
    );

    // O formulário de edição espera a lista achatada em ids de tipo.
    const tipos = Array.isArray(infrator.tipos_agressao_lista)
      ? (infrator.tipos_agressao_lista as any[])
          .map((item) => Number(item?.infratores_tipos_agressao_id?.tipo_agressao_id))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];

    return {
      success: true,
      data: { ...infrator, tipos_agressao_lista: tipos },
    };
  } catch (error) {
    console.error("Erro ao buscar infrator:", error);
    return {
      success: false,
      error: "Erro ao buscar dados do autor.",
    };
  }
}
