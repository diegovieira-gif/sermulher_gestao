"use server";

import { getDirectusClient } from "@/lib/directus";
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
    const directus = await getDirectusClient({ requireAuth: true });

    // Prefixo ano-mês atual (ex.: "2026-06"). Usar componentes locais evita
    // discrepâncias de timezone (o container roda tipicamente em UTC).
    const now = new Date();
    const anoMesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Buscar beneficiárias e atendimentos em paralelo.
    // Importante: não silenciar erros com `[]` — um erro transitório (timeout,
    // 4xx) zeraria os KPIs sem aviso. Falhas reais devem propagar para o catch
    // externo e exibir o card de erro na página.
    const [beneficiarias, atendimentos] = await Promise.all([
      directus.request(
        readItems("beneficiarias", {
          fields: ["id"],
          limit: -1,
        })
      ),
      directus.request(
        readItems("atendimentos", {
          fields: [
            "id",
            "status",
            "data_abertura",
            "date_created",
            "tipos_violencia",
            "beneficiaria.id",
            "beneficiaria.nome_completo",
          ],
          limit: -1,
          sort: ["-data_abertura"],
        })
      ),
    ]);

    // 1. KPIs
    const totalBeneficiarias = beneficiarias.length;
    
    // Casos ativos são os que estão "Aberto" ou "Em andamento"
    const atendimentosEmAndamento = atendimentos.filter(
      (a: any) => a.status === "Em andamento" || a.status === "Aberto"
    ).length;

    // Novos atendimentos este mês: compara o prefixo ano-mês de data_abertura
    // (com fallback para date_created, caso o registro tenha sido criado direto
    // no Directus sem preencher data_abertura).
    const novosAtendimentosMes = atendimentos.filter((a: any) => {
      const dataRef = a.data_abertura || a.date_created;
      if (!dataRef) return false;
      return String(dataRef).slice(0, 7) === anoMesAtual;
    }).length;

    // 2. Gráfico: Tipos de Violência - Agrupar por tipos_violencia (que é uma string separada por vírgula no banco)
    const contagemViolencia: Record<string, number> = {};
    atendimentos.forEach((item: any) => {
      if (item.tipos_violencia) {
        const tipos = item.tipos_violencia
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
        
        tipos.forEach((tipo: string) => {
          contagemViolencia[tipo] = (contagemViolencia[tipo] || 0) + 1;
        });
      }
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

    // 3. Últimos 5 atendimentos (ordenados por data_abertura)
    const ultimosAtendimentos = atendimentos
      .slice(0, 5)
      .map((a: any) => {
        const dataRef = a.data_abertura;
        let dataFormatada = "-";
        if (dataRef) {
          try {
            const datePart = dataRef.split("T")[0];
            const [ano, mes, dia] = datePart.split("-");
            dataFormatada = `${dia}/${mes}/${ano}`;
          } catch {
            dataFormatada = dataRef;
          }
        }
        return {
          id: a.id,
          nomeBeneficiaria: a.beneficiaria?.nome_completo || "Não informado",
          data: dataFormatada,
          tipoAtendimento: a.tipos_violencia || "Não informado",
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
