"use server";

import { getDirectusAdmin } from "@/lib/directus";
import { assertAccess } from "@/lib/permissions";
import { readItems } from "@directus/sdk";
import { filtroMesDateTime } from "../calculos";

/**
 * Tipos de retorno para o RMA
 */
export type RMAStats = {
  volume: {
    novos_casos: number;
    atendimentos_tecnicos: number; // Tramitações
    total_movimento: number; // Soma dos dois
  };
  setores: {
    nome: string;
    quantidade: number;
  }[];
  violencia: {
    tipo: string;
    quantidade: number;
  }[];
};

/**
 * Limites do mês para `data_abertura` e `data_recebimento` — campos
 * `dateTime` (hora de parede, sem fuso): `_gte` dia 1 00:00 e `_lt` dia 1 do
 * mês seguinte. Antes os limites saíam de `toISOString()` (UTC), deslocados
 * 3 horas em relação ao que foi digitado: entravam casos do mês anterior e
 * saíam os das últimas horas do mês.
 */
function getRangeDatas(mes: number, ano: number): { _gte: string; _lt: string } {
  // Validação de entrada
  if (mes < 1 || mes > 12) {
    throw new Error("Mês inválido. Deve estar entre 1 e 12.");
  }
  if (ano < 2000 || ano > 2100) {
    throw new Error("Ano inválido. Deve estar entre 2000 e 2100.");
  }

  return filtroMesDateTime(ano, mes);
}

/**
 * Busca estatísticas do RMA
 */
export async function getRMAStats({
  mes,
  ano,
}: {
  mes: number;
  ano: number;
}): Promise<{ success: true; data: RMAStats } | { success: false; error: string }> {
  // Autorização (módulo Relatórios) + cliente admin lazy.
  await assertAccess("relatorios");
  const directus = getDirectusAdmin();
  try {
    const periodo = getRangeDatas(mes, ano);

    // 1. Busca NOVOS CASOS (Atendimentos criados no mês)
    // Contamos apenas atendimentos abertos neste mês
    const atendimentos = await directus.request(
      readItems("atendimentos", {
        fields: ["id", "tipos_violencia"],
        filter: {
          data_abertura: periodo,
        },
        limit: -1,
      })
    );

    const novosCasos = atendimentos.length;

    // 2. Busca TRAMITAÇÕES (Volume de Atendimentos)
    // Contamos todas as tramitações recebidas no mês (evolução, atendimento técnico, etc)
    const tramitacoes = await directus.request(
      readItems("tramitacoes", {
        fields: [
          "id",
          {
            setor_responsavel: ["nome"]
          }
        ],
        filter: {
          data_recebimento: periodo,
        },
        limit: -1,
      })
    );

    const atendimentosTecnicos = tramitacoes.length;

    // 3. Agrupamento por Setor (Baseado nas Tramitações)
    const setoresMap = new Map<string, number>();

    // Inicializa setores comuns com 0 para garantir que apareçam
    // (Opcional, mas bom para relatório consistente)
    // setoresMap.set("Psicologia", 0);
    // setoresMap.set("Serviço Social", 0);
    // setoresMap.set("Jurídico", 0);

    tramitacoes.forEach((t: any) => { // Using any for rough typing matching directus return
      const nomeSetor = t.setor_responsavel?.nome || "Não Identificado";
      setoresMap.set(nomeSetor, (setoresMap.get(nomeSetor) || 0) + 1);
    });

    const setoresStats = Array.from(setoresMap.entries())
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // 4. Perfil da Violência (Baseado nos NOVOS CASOS)
    const violenciaMap = new Map<string, number>();

    atendimentos.forEach((a: any) => {
      if (a.tipos_violencia) {
        // Pode ser string CSV ou array dependendo da implementação, assumindo string CSV baseado no código anterior
        const tipos = typeof a.tipos_violencia === 'string'
          ? a.tipos_violencia.split(',')
          : (Array.isArray(a.tipos_violencia) ? a.tipos_violencia : []);

        tipos.forEach((tipo: string) => {
          const tipoLimpo = tipo.trim();
          if (tipoLimpo) {
            violenciaMap.set(tipoLimpo, (violenciaMap.get(tipoLimpo) || 0) + 1);
          }
        });
      }
    });

    const violenciaStats = Array.from(violenciaMap.entries())
      .map(([tipo, quantidade]) => ({ tipo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    return {
      success: true,
      data: {
        volume: {
          novos_casos: novosCasos,
          atendimentos_tecnicos: atendimentosTecnicos,
          total_movimento: novosCasos + atendimentosTecnicos
        },
        setores: setoresStats,
        violencia: violenciaStats
      },
    };

  } catch (error) {
    console.error("Erro ao buscar dados do RMA:", error);
    return {
      success: false,
      error: "Erro ao buscar dados do RMA.",
    };
  }
}
