import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import Link from "next/link";
import { Users, RefreshCw, AlertTriangle } from "lucide-react";
import { SalaAzulStatsChart } from "./sala-azul-stats-chart";

export const dynamic = "force-dynamic";

interface Stats {
  ciclosAtivos: number;
  totalParticipantes: number;
  alertaRisco: number;
  distribuicaoPericulosidade: Array<{
    nivel: string;
    quantidade: number;
  }>;
}

async function getStats(): Promise<Stats> {
  try {
    const [infratores, salas] = await Promise.all([
      directus.request(
        readItems("infratores", {
          // Busca apenas o ID e o Nome do Nível para contagem
          fields: ["id", "nivel_id.nome"] as any,
          limit: -1,
        }),
      ),
      directus.request(
        readItems("salas_azul", {
          fields: ["id", "status"],
          limit: -1,
        }),
      ),
    ]);

    // 1. Ciclos Ativos
    const ciclosAtivos = salas.filter(
      (s: any) => s.status === "Em Andamento",
    ).length;

    // 2. Total Participantes
    const totalParticipantes = infratores.length;

    // 3. Distribuição e Risco
    let alertaRisco = 0;
    const distribuicaoMap: Record<string, number> = {};

    infratores.forEach((inf: any) => {
      const nomeNivel = inf.nivel_id?.nome || "Não Classificado";

      // Contagem para o gráfico
      distribuicaoMap[nomeNivel] = (distribuicaoMap[nomeNivel] || 0) + 1;

      // Lógica de Risco (Case insensitive)
      const nivelLower = nomeNivel.toLowerCase();
      if (nivelLower.includes("alto") || nivelLower.includes("crítico")) {
        alertaRisco++;
      }
    });

    const distribuicaoPericulosidade = Object.entries(distribuicaoMap).map(
      ([nivel, qtd]) => ({
        nivel,
        quantidade: qtd,
      }),
    );

    return {
      ciclosAtivos,
      totalParticipantes,
      alertaRisco,
      distribuicaoPericulosidade,
    };
  } catch (error) {
    console.error("Erro ao carregar stats Sala Azul:", error);
    return {
      ciclosAtivos: 0,
      totalParticipantes: 0,
      alertaRisco: 0,
      distribuicaoPericulosidade: [],
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

      {/* Cards de Acesso Rápido */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/sala-azul/infratores">
          <div className="flex h-full cursor-pointer flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:bg-accent/50 hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Gestão de Infratores</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastrar, monitorar e avaliar participantes
                </p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/sala-azul/ciclos">
          <div className="flex h-full cursor-pointer flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:bg-accent/50 hover:border-primary/50">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <RefreshCw className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Gestão de Ciclos</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciar turmas, cronogramas e frequência
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">
              Ciclos Ativos
            </h3>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.ciclosAtivos}</div>
          <p className="text-xs text-muted-foreground">Turmas em andamento</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">
              Total Participantes
            </h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats.totalParticipantes}</div>
          <p className="text-xs text-muted-foreground">
            Infratores cadastrados
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">
              Alerta de Risco
            </h3>
            <AlertTriangle
              className={`h-4 w-4 ${
                stats.alertaRisco > 0 ? "text-red-500" : "text-muted-foreground"
              }`}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              stats.alertaRisco > 0 ? "text-red-600" : ""
            }`}
          >
            {stats.alertaRisco}
          </div>
          <p className="text-xs text-muted-foreground">Nível Alto ou Crítico</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        <SalaAzulStatsChart data={stats.distribuicaoPericulosidade} />
      </div>
    </div>
  );
}
