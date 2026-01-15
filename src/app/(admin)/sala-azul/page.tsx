import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import Link from "next/link";
import { Users, RefreshCw, AlertTriangle } from "lucide-react";
import { NivelPericulosidade } from "./infratores/schemas";
import { SalaAzulStatsChart } from "./sala-azul-stats-chart";

interface Stats {
  ciclosAtivos: number;
  totalParticipantes: number;
  alertaRisco: number;
  distribuicaoPericulosidade: Array<{
    nivel: string;
    quantidade: number;
  }>;
}

/**
 * Busca estatísticas do módulo Sala Azul
 */
async function getStats(): Promise<Stats> {
  try {
    // Busca dados em paralelo
    const [infratores, salas] = await Promise.all([
      directus
        .request(
          readItems("infratores", {
            fields: ["id", "nivel_periculosidade"],
            limit: -1,
          })
        )
        .catch(() => []),
      directus
        .request(
          readItems("salas_azul", {
            fields: ["id", "status"],
            limit: -1,
          })
        )
        .catch(() => []),
    ]);

    // Conta ciclos ativos (status 'Em Andamento')
    const ciclosAtivos =
      Array.isArray(salas) && salas.length > 0
        ? salas.filter((sala: any) => sala.status === "Em Andamento").length
        : 0;

    // Conta total de participantes
    const totalParticipantes = Array.isArray(infratores) ? infratores.length : 0;

    // Agrupa infratores por nível de periculosidade
    const distribuicaoMap: Record<string, number> = {
      [NivelPericulosidade.BAIXO]: 0,
      [NivelPericulosidade.MEDIO]: 0,
      [NivelPericulosidade.ALTO]: 0,
      [NivelPericulosidade.CRITICO]: 0,
    };

    if (Array.isArray(infratores) && infratores.length > 0) {
      infratores.forEach((infrator: any) => {
        const nivel = infrator.nivel_periculosidade;
        if (nivel && distribuicaoMap[nivel] !== undefined) {
          distribuicaoMap[nivel] = (distribuicaoMap[nivel] || 0) + 1;
        }
      });
    }

    // Calcula alerta de risco (Alto + Crítico)
    const alertaRisco =
      (distribuicaoMap[NivelPericulosidade.ALTO] || 0) +
      (distribuicaoMap[NivelPericulosidade.CRITICO] || 0);

    // Converte para array para o gráfico
    const distribuicaoPericulosidade = Object.entries(distribuicaoMap).map(
      ([nivel, quantidade]) => ({
        nivel,
        quantidade,
      })
    );

    return {
      ciclosAtivos,
      totalParticipantes,
      alertaRisco,
      distribuicaoPericulosidade,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    // Retorna valores padrão em caso de erro
    return {
      ciclosAtivos: 0,
      totalParticipantes: 0,
      alertaRisco: 0,
      distribuicaoPericulosidade: [
        { nivel: NivelPericulosidade.BAIXO, quantidade: 0 },
        { nivel: NivelPericulosidade.MEDIO, quantidade: 0 },
        { nivel: NivelPericulosidade.ALTO, quantidade: 0 },
        { nivel: NivelPericulosidade.CRITICO, quantidade: 0 },
      ],
    };
  }
}

export default async function SalaAzulPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Sala Azul - Grupos Reflexivos
        </h1>
        <p className="text-muted-foreground">
          Gestão de medidas protetivas e reabilitação
        </p>
      </div>

      {/* Seção de Acesso Rápido */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Acesso Rápido
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card Infratores */}
          <Link href="/sala-azul/infratores">
            <div className="rounded-lg border-2 border-border bg-card p-6 shadow-sm hover:bg-muted/50 cursor-pointer transition-all">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-4">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Gestão de Infratores
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Cadastrar e monitorar participantes
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Card Ciclos/Turmas */}
          <Link href="/sala-azul/ciclos">
            <div className="rounded-lg border-2 border-border bg-card p-6 shadow-sm hover:bg-muted/50 cursor-pointer transition-all">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <RefreshCw className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Gestão de Ciclos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gerenciar turmas e lançar frequência
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Seção de Monitoramento (KPIs) */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Monitoramento
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card: Ciclos Ativos */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ciclos Ativos
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stats.ciclosAtivos}
                </p>
              </div>
              <div className="rounded-full bg-blue-50 dark:bg-blue-900/30 p-3">
                <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Card: Total de Participantes */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Participantes
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stats.totalParticipantes}
                </p>
              </div>
              <div className="rounded-full bg-purple-50 dark:bg-purple-900/30 p-3">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Card: Alerta de Risco */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Alerta de Risco
                </p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    stats.alertaRisco > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-foreground"
                  }`}
                >
                  {stats.alertaRisco}
                </p>
              </div>
              <div className="rounded-full bg-red-50 dark:bg-red-900/30 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Distribuição */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Distribuição por Nível de Periculosidade
        </h2>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <SalaAzulStatsChart data={stats.distribuicaoPericulosidade} />
        </div>
      </div>
    </div>
  );
}
