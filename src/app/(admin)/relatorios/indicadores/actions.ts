"use server";

import { getDirectusAdmin } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import { readItems } from "@directus/sdk";
import { limitesDoMes } from "@/lib/datas";
import { FAIXAS_ETARIAS, faixaEtaria, filtroMesDateTime, idadeEm } from "../calculos";

export type IndicadoresData = {
    identificacao: {
        totalAtendimentos: number;
        porOrigem: { name: string; value: number }[];
        porTipoDemanda: { name: string; value: number }[];
    };
    acoes: {
        atendimentosTecnicos: {
            total: number;
            individual: number;
            coletivo: number;
            encaminhamentos: number;
            devolutivas: number;
        };
        porSetor: { name: string; value: number }[];
        educacao: {
            turmasAtivas: number;
            totalAlunas: number;
        };
        eventos: {
            total: number;
            reunioesRede: number;
        };
    };
    comunicacao: {
        totalPosts: number;
        alcanceTotal: number;
        topPost: { titulo: string; alcance: number; canal: string } | null;
        porCanal: { name: string; value: number }[];
    };
    perfil: {
        faixaEtaria: { name: string; value: number }[];
        racaCor: { name: string; value: number }[];
        escolaridade: { name: string; value: number }[];
    };
};

export async function getIndicadoresCRAM(
    mes: number,
    ano: number,
): Promise<{ success: boolean; data?: IndicadoresData; error?: string }> {
    // Autorização (módulo Relatórios) + cliente admin lazy.
    await assertAccess("relatorios");
    const directus = getDirectusAdmin();
    try {
        // Campos `date` (data_inicio/data_fim de turma, data_publicacao) usam o
        // dia 1 e o último dia; campos `dateTime` (data_abertura,
        // data_recebimento, data_inicio de evento) usam `_gte`/`_lt` — com
        // `_between` até "último dia 00:00" o último dia do mês sumia.
        const { inicio: startDateStr, fim: endDateStr } = limitesDoMes(ano, mes);
        const mesDateTime = filtroMesDateTime(ano, mes);

        // --- 1. BUSCA PARALELA DOS DADOS ---
        // Usando try/catch individual para identificar qual requisição falhou
        const promises = [
            // A. ATENDIMENTOS (Novos Casos) — também a base do perfil
            // demográfico: são as mulheres que CHEGARAM no mês.
            directus.request(
                readItems("atendimentos", {
                    fields: [
                        "id",
                        "data_abertura",
                        "origem_id.nome",
                        "beneficiaria.id",
                        "beneficiaria.data_nascimento",
                        "beneficiaria.raca_cor_id.nome",
                        "beneficiaria.escolaridade_id.nome",
                    ],
                    filter: {
                        data_abertura: mesDateTime,
                    },
                    limit: -1,
                }),
            ).then(res => ({ status: 'fulfilled', value: res, key: 'atendimentos' }))
                .catch(err => ({ status: 'rejected', reason: err, key: 'atendimentos' })),

            // B. TRAMITAÇÕES (Atendimentos Técnicos)
            directus.request(
                readItems("tramitacoes", {
                    fields: ["id", "tipo_demanda", "setor_responsavel.nome"], // Added sector name
                    filter: {
                        data_recebimento: mesDateTime,
                    },
                    limit: -1,
                }),
            ).then(res => ({ status: 'fulfilled', value: res, key: 'tramitacoes' }))
                .catch(err => ({ status: 'rejected', reason: err, key: 'tramitacoes' })),

            // C. ESCOLA (Turmas Ativas)
            directus.request(
                readItems("escola_turmas", {
                    fields: ["id"],
                    filter: {
                        _and: [
                            { data_inicio: { _lte: endDateStr } },
                            {
                                _or: [
                                    { data_fim: { _gte: startDateStr } },
                                    { data_fim: { _null: true } },
                                ],
                            },
                        ],
                    },
                    limit: -1,
                }),
            ).then(res => ({ status: 'fulfilled', value: res, key: 'turmas' }))
                .catch(err => ({ status: 'rejected', reason: err, key: 'turmas' })),

            // D. EVENTOS & REUNIÕES
            directus.request(
                readItems("eventos_campanhas", {
                    fields: ["id", "nome", "tipo_id.nome"],
                    filter: {
                        data_inicio: mesDateTime,
                    },
                    limit: -1,
                }),
            ).then(res => ({ status: 'fulfilled', value: res, key: 'eventos' }))
                .catch(err => ({ status: 'rejected', reason: err, key: 'eventos' })),

            // E. MARKETING
            directus.request(
                readItems("marketing_items", {
                    fields: ["id", "canal", "alcance", "titulo"],
                    filter: {
                        data_publicacao: { _between: [startDateStr, endDateStr] },
                    },
                    limit: -1,
                }),
            ).then(res => ({ status: 'fulfilled', value: res, key: 'marketing' }))
                .catch(err => ({ status: 'rejected', reason: err, key: 'marketing' })),

            // F. ALUNAS MATRICULADAS — matrículas vigentes (nem canceladas nem
            // evadidas) em turmas que estiveram em curso no mês: o mesmo
            // critério de "Turmas ativas", para os dois números conversarem.
            directus.request(
                readItems("escola_matriculas", {
                    fields: ["beneficiaria"],
                    filter: {
                        _and: [
                            { turma: { data_inicio: { _lte: endDateStr } } },
                            {
                                _or: [
                                    { turma: { data_fim: { _gte: startDateStr } } },
                                    { turma: { data_fim: { _null: true } } },
                                ],
                            },
                            {
                                _or: [
                                    { status: { _nin: ["cancelada", "evadida"] } },
                                    { status: { _null: true } },
                                ],
                            },
                        ],
                    },
                    limit: -1,
                }),
            ).then(res => ({ status: 'fulfilled', value: res, key: 'matriculas' }))
                .catch(err => ({ status: 'rejected', reason: err, key: 'matriculas' })),
        ];

        const results = await Promise.all(promises);

        // Verificar Erros
        const errors = results.filter(r => r.status === 'rejected');
        if (errors.length > 0) {
            console.error("FAILURES IN FETCH:", JSON.stringify(errors, null, 2));
            // Se falhar algum crítico, retornamos erro. 
            // Se falhar mkt, podemos seguir.
            // Vamos ser estritos por enquanto para debugging.
            // @ts-ignore
            throw new Error(`Falha em: ${errors.map(e => e.key).join(', ')}`);
        }

        // @ts-ignore
        const atendimentos = results.find(r => r.key === 'atendimentos').value;
        // @ts-ignore
        const tramitacoes = results.find(r => r.key === 'tramitacoes').value;
        // @ts-ignore
        const turmas = results.find(r => r.key === 'turmas').value;
        // @ts-ignore
        const eventos = results.find(r => r.key === 'eventos').value;
        // @ts-ignore
        const marketing = results.find(r => r.key === 'marketing').value;
        // @ts-ignore
        const matriculas = results.find(r => r.key === 'matriculas').value;
        // A mesma aluna em duas turmas conta uma vez.
        const totalAlunas = new Set(
            (matriculas as any[]).map((m) => m.beneficiaria).filter((b) => b != null),
        ).size;

        // --- 2. PROCESSAMENTO (Identificação & Demanda) ---
        // Agrupar por Origem
        const origemCount: Record<string, number> = {};
        const demandaCount: Record<string, number> = { Espontânea: 0, Encaminhada: 0 };

        // Termos comuns que indicam demanda espontânea
        const termosEspontanea = ["espontânea", "espontanea", "própria", "propria"];

        atendimentos.forEach((a: any) => {
            const origemNome = a.origem_id?.nome || "Não informado";
            origemCount[origemNome] = (origemCount[origemNome] || 0) + 1;

            // Lógica heurística para Tipo de Demanda baseada no nome da origem
            const nomeLower = origemNome.toLowerCase();
            const ehEspontanea = termosEspontanea.some(term => nomeLower.includes(term));

            if (ehEspontanea) {
                demandaCount["Espontânea"]++;
            } else {
                demandaCount["Encaminhada"]++;
            }
        });

        const porOrigem = Object.entries(origemCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const porTipoDemanda = Object.entries(demandaCount)
            .map(([name, value]) => ({ name, value }));

        // --- 3. PROCESSAMENTO (Ações) ---
        // Tramitações (Individual vs Coletivo / Setor / Encaminhamento / Devolutiva)
        let tecTotal = 0;
        let tecIndividual = 0;
        let tecColetivo = 0;
        let tecEncaminhamentos = 0;
        let tecDevolutivas = 0;
        const setorCount: Record<string, number> = {};

        tramitacoes.forEach((t: any) => {
            tecTotal++;

            const tipo = t.tipo_demanda?.toLowerCase() || "";
            const setor = t.setor_responsavel?.nome || "Geral";

            // Contagem por setor
            setorCount[setor] = (setorCount[setor] || 0) + 1;

            // Classificação Individual vs Coletivo
            if (tipo.includes("coletiv")) {
                tecColetivo++;
            } else {
                tecIndividual++;
            }

            // Classificação Encaminhamento vs Devolutiva
            if (tipo.includes("encaminhamento")) {
                tecEncaminhamentos++;
            }
            if (tipo.includes("devolutiva") || tipo.includes("retorno")) {
                tecDevolutivas++;
            }
        });

        const porSetor = Object.entries(setorCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Eventos
        let reunioesRede = 0;
        eventos.forEach((e: any) => {
            const tipo = e.tipo_id?.nome?.toLowerCase() || "";
            const nome = e.nome?.toLowerCase() || "";
            if (tipo.includes("reuni") || nome.includes("reuni")) {
                reunioesRede++;
            }
        });

        // --- 4. PROCESSAMENTO (Marketing) ---
        let mktAlcance = 0;
        let topPostItem: { titulo: string; alcance: number; canal: string } | null = null;
        const mktCanais: Record<string, number> = {};

        marketing.forEach((m: any) => {
            const alcance = Number(m.alcance || 0);
            mktAlcance += alcance;

            const canal = m.canal || "Outros";
            mktCanais[canal] = (mktCanais[canal] || 0) + 1;

            if (!topPostItem || alcance > (topPostItem.alcance || 0)) {
                topPostItem = { titulo: m.titulo, alcance, canal };
            }
        });

        const porCanal = Object.entries(mktCanais)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);


        // --- 5. PROCESSAMENTO (Perfil das Usuárias) ---
        // "Novos casos" = beneficiárias dos atendimentos ABERTOS no mês. Antes
        // vinha das tramitações recebidas no mês, que misturam casos antigos
        // e deixam de fora quem chegou e ainda não foi encaminhada.
        // Dedup: a mesma mulher com dois atendimentos no mês conta uma vez.
        const beneficiariasUnicas = new Map<number, { b: any; referencia: string }>();

        atendimentos.forEach((a: any) => {
            const benef = a.beneficiaria;
            if (benef?.id && !beneficiariasUnicas.has(benef.id)) {
                beneficiariasUnicas.set(benef.id, {
                    b: benef,
                    referencia: String(a.data_abertura || endDateStr),
                });
            }
        });

        // Adicionar também as dos novos atendimentos (caso não tenham tramitação ainda - raro, mas possível)
        // Para simplificar, vou assumir que novos atendimentos geram tramitação inicial. 
        // Se não, precisaria buscar os dados demograficos das beneficiarias dos novos atendimentos tb.
        // Vamos fazer um "merge" seguro se estivessemos buscando ambos, mas o fetch F pegou via tramitação.
        // Para garantir cobertura 100%, vamos assumir que as tramitacoes cobrem o movimento.

        const perfilRaca: Record<string, number> = {};
        const perfilEscolaridade: Record<string, number> = {};
        const perfilFaixaEtaria: Record<string, number> = Object.fromEntries(
            FAIXAS_ETARIAS.map((f) => [f, 0]),
        );

        beneficiariasUnicas.forEach(({ b, referencia }) => {
            // Raça
            const raca = b.raca_cor_id?.nome || "Não informada";
            perfilRaca[raca] = (perfilRaca[raca] || 0) + 1;

            // Escolaridade
            const escola = b.escolaridade_id?.nome || "Não informada";
            perfilEscolaridade[escola] = (perfilEscolaridade[escola] || 0) + 1;

            // Idade na data em que chegou ao serviço; menores de 18 e datas
            // ausentes têm faixa própria em vez de distorcer/sumir do total.
            perfilFaixaEtaria[faixaEtaria(idadeEm(b.data_nascimento, referencia))]++;
        });

        const racaCorData = Object.entries(perfilRaca).map(([name, value]) => ({ name, value }));
        const escolaridadeData = Object.entries(perfilEscolaridade).map(([name, value]) => ({ name, value }));
        const faixaEtariaData = Object.entries(perfilFaixaEtaria).map(([name, value]) => ({ name, value }));
        return {
            success: true,
            data: {
                identificacao: {
                    totalAtendimentos: atendimentos.length,
                    porOrigem,
                    porTipoDemanda,
                },
                acoes: {
                    atendimentosTecnicos: {
                        total: tecTotal,
                        individual: tecIndividual,
                        coletivo: tecColetivo,
                        encaminhamentos: tecEncaminhamentos,
                        devolutivas: tecDevolutivas,
                    },
                    porSetor,
                    educacao: {
                        turmasAtivas: turmas.length,
                        totalAlunas,
                    },
                    eventos: {
                        total: eventos.length,
                        reunioesRede,
                    },
                },
                comunicacao: {
                    totalPosts: marketing.length,
                    alcanceTotal: mktAlcance,
                    topPost: topPostItem,
                    porCanal,
                },
                perfil: {
                    faixaEtaria: faixaEtariaData,
                    racaCor: racaCorData,
                    escolaridade: escolaridadeData,
                },
            },
        };

    } catch (error) {
        console.error("Erro ao gerar indicadores CRAM:", error);
        return { success: false, error: "Erro ao processar dados." };
    }
}
