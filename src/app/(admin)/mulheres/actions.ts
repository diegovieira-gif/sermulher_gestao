"use server";

import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";

// Tipos para as estatísticas
export type MulheresDashboardStats = {
  kpis: {
    totalBeneficiarias: number;
    atendimentosEmAndamento: number;
    novosAtendimentosMes: number;
  };
  tiposViolencia: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  ultimosAtendimentos: Array<{
    id: number;
    nomeBeneficiaria: string;
    data: string;
    tipoAtendimento: string;
    status: string;
  }>;
};

// Cores para os tipos de violência (tema Lilás/Roxo/Rosa/Azul)
const CORES_VIOLENCIA = [
  "#a855f7", // Roxo médio
  "#ec4899", // Rosa
  "#f472b6", // Rosa claro
  "#d946ef", // Magenta
  "#c084fc", // Roxo claro
  "#e879f9", // Lavanda
  "#f0abfc", // Lavanda claro
  "#6366f1", // Índigo/Azul
  "#8b5cf6", // Violeta
];

/**
 * Busca estatísticas do dashboard do módulo Mulheres
 */
export async function getMulheresDashboardStats(): Promise<
  | { success: true; data: MulheresDashboardStats }
  | { success: false; error: string }
> {
  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    // Buscar beneficiárias e mulheres_atendimentos em paralelo
    const [beneficiarias, mulheresAtendimentos] = await Promise.all([
      directus
        .request(
          readItems("beneficiarias", {
            fields: ["id"],
            limit: -1,
          })
        )
        .catch(() => []),
      directus
        .request(
          readItems("mulheres_atendimentos", {
            fields: [
              "id",
              "status",
              "situacao_violencia",
              "tipo_atendimento",
              "data_atendimento",
              "date_created",
              "beneficiaria.id",
              "beneficiaria.nome_completo",
            ],
            limit: -1,
            sort: ["-date_created"],
          })
        )
        .catch(() => []),
    ]);

    // 1. KPIs
    const totalBeneficiarias = beneficiarias.length;
    const atendimentosEmAndamento = mulheresAtendimentos.filter(
      (a: any) => a.status === "Em andamento"
    ).length;

    // Novos atendimentos este mês (baseado em date_created ou data_atendimento)
    const novosAtendimentosMes = mulheresAtendimentos.filter((a: any) => {
      const dataRef = a.date_created || a.data_atendimento;
      if (!dataRef) return false;
      const data = new Date(dataRef);
      return data >= inicioMes;
    }).length;

    // 2. Gráfico: Tipos de Violência - Agrupar por situacao_violencia
    const contagemViolencia: Record<string, number> = {};
    mulheresAtendimentos.forEach((item: any) => {
      const tipo = item.situacao_violencia || "Não informado";
      contagemViolencia[tipo] = (contagemViolencia[tipo] || 0) + 1;
    });

    const tiposViolenciaData = Object.entries(contagemViolencia).map(
      ([name, value], index) => ({
        name,
        value,
        fill: CORES_VIOLENCIA[index % CORES_VIOLENCIA.length],
      })
    );

    // Se não houver dados, criar um placeholder
    if (tiposViolenciaData.length === 0) {
      tiposViolenciaData.push({
        name: "Sem dados",
        value: 0,
        fill: CORES_VIOLENCIA[0],
      });
    }

    // 3. Últimos 5 atendimentos (ordenados por date_created ou data_atendimento)
    const ultimosAtendimentos = mulheresAtendimentos
      .slice(0, 5)
      .map((a: any) => {
        const dataRef = a.data_atendimento || a.date_created;
        return {
          id: a.id,
          nomeBeneficiaria: a.beneficiaria?.nome_completo || "Não informado",
          data: dataRef
            ? new Date(dataRef).toLocaleDateString("pt-BR")
            : "-",
          tipoAtendimento: a.tipo_atendimento || "Não informado",
          status: a.status || "Sem status",
        };
      });

    return {
      success: true,
      data: {
        kpis: {
          totalBeneficiarias,
          atendimentosEmAndamento,
          novosAtendimentosMes,
        },
        tiposViolencia: tiposViolenciaData,
        ultimosAtendimentos,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de mulheres:", error);
    return {
      success: false,
      error:
        "Erro ao buscar estatísticas. Verifique a conexão com o banco de dados.",
    };
  }
}
