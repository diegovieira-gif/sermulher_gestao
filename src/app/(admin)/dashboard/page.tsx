import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import { DashboardCharts } from "./dashboard-charts";

export default async function DashboardPage() {
  try {
    // Verificar configuração
    if (!process.env.NEXT_PUBLIC_DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
      return (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm text-orange-800">
            ⚠️ <strong>Modo de demonstração:</strong> Conecte-se ao Directus para ver dados reais.
          </p>
        </div>
      );
    }

    // 1. Buscas Paralelas Otimizadas (Apenas campos necessários)
    const [beneficiarias, atendimentos, infratores, eventos] = await Promise.all([
      directus.request(
        readItems("beneficiarias", {
          limit: -1,
          fields: ["id"],
        })
      ).catch((err): any[] => {
        console.error("❌ Erro ao buscar beneficiarias:", err);
        return [];
      }),
      directus.request(
        readItems("atendimentos", {
          limit: -1,
          fields: ["id", "data_abertura", "status"],
        })
      ).catch((err): any[] => {
        console.error("❌ Erro ao buscar atendimentos:", err);
        return [];
      }),
      directus.request(
        readItems("infratores", {
          limit: -1,
          fields: ["id"],
        })
      ).catch((err): any[] => {
        console.error("❌ Erro ao buscar infratores:", err);
        return [];
      }),
      directus.request(
        readItems("eventos_campanhas", {
          limit: -1,
          fields: ["id"],
        })
      ).catch((err): any[] => {
        console.error("❌ Erro ao buscar eventos:", err);
        return [];
      }),
    ]);

    // 2. Processamento para Gráficos
    // Gráfico 1: Atendimentos por Mês (Baseado em data_abertura)
    const atendimentosPorMes = atendimentos.reduce((acc: any[], curr: any) => {
      if (!curr.data_abertura) return acc;
      
      const data = new Date(curr.data_abertura);
      const mes = data.toLocaleString("pt-BR", { month: "short" }); // Ex: "jan"
      
      const existing = acc.find((item: any) => item.month === mes);
      if (existing) {
        existing.atendimentos += 1;
      } else {
        acc.push({ month: mes, atendimentos: 1 });
      }
      return acc;
    }, []);

    // Ordenar por mês (últimos 6 meses)
    const mesesOrdem = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    atendimentosPorMes.sort((a, b) => {
      const indexA = mesesOrdem.indexOf(a.month.toLowerCase());
      const indexB = mesesOrdem.indexOf(b.month.toLowerCase());
      return indexA - indexB;
    });

    // Pegar apenas os últimos 6 meses
    const ultimosMeses = atendimentosPorMes.slice(-6);

    // Gráfico 2: Distribuição por Status
    const cores = ["#9333ea", "#f97316", "#3b82f6", "#10b981", "#ef4444"];
    const distribuicaoStatus = atendimentos.reduce((acc: any[], curr: any) => {
      const status = curr.status || "Sem Status";
      const existing = acc.find((item: any) => item.name === status);
      
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({
          name: status,
          value: 1,
          color: cores[acc.length % cores.length],
        });
      }
      return acc;
    }, []);

    // 3. Renderização
    return (
      <DashboardCharts
        totalBeneficiarias={beneficiarias.length}
        totalAtendimentos={atendimentos.length}
        totalInfratores={infratores.length}
        totalEventos={eventos.length}
        atendimentosPorMes={ultimosMeses.length > 0 ? ultimosMeses : [
          { month: "jan", atendimentos: 0 },
          { month: "fev", atendimentos: 0 },
          { month: "mar", atendimentos: 0 },
        ]}
        distribuicaoSetores={distribuicaoStatus.length > 0 ? distribuicaoStatus : [
          { name: "Sem dados", value: 1, color: "#9333ea" },
        ]}
      />
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao buscar dados do dashboard:", errorMessage);
    console.error("Detalhes do erro:", error);
    
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Erro ao carregar dashboard
        </h3>
        <p className="text-destructive mb-2">
          Não foi possível carregar os dados. Verifique:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Se o Directus está rodando ({process.env.NEXT_PUBLIC_DIRECTUS_URL || "URL não configurada"})</li>
          <li>Se as variáveis de ambiente estão configuradas (.env.local)</li>
          <li>Se o token de acesso é válido</li>
          <li>Se as collections (beneficiarias, atendimentos, infratores, eventos_campanhas) existem</li>
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-destructive hover:underline">
            Ver detalhes técnicos
          </summary>
          <pre className="mt-2 p-3 bg-destructive/5 rounded text-xs overflow-auto">
            {errorMessage}
          </pre>
        </details>
      </div>
    );
  }
}
