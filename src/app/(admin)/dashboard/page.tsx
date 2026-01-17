import { getDashboardStats, getGlobalDashboardStats } from "./actions";
import { OverviewClient } from "./overview-client";

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

    // Tenta carregar o novo dashboard primeiro
    const result = await getDashboardStats();

    if (result.success) {
      // Se conseguir o novo dashboard, renderiza com o novo componente
      return <OverviewClient stats={result.data} userName="Secretária" />;
    }

    // Se não conseguir o novo, tenta o antigo (global)
    const globalResult = await getGlobalDashboardStats();

    if (!globalResult.success) {
      return (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Erro ao carregar dashboard
          </h3>
          <p className="text-destructive mb-2">
            {globalResult.error}
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Se o Directus está rodando ({process.env.NEXT_PUBLIC_DIRECTUS_URL || "URL não configurada"})</li>
            <li>Se as variáveis de ambiente estão configuradas (.env.local)</li>
            <li>Se o token de acesso é válido</li>
            <li>Se as collections existem</li>
          </ul>
        </div>
      );
    }

    // Renderiza o dashboard antigo como fallback
    return <OverviewClient stats={globalResult.data} />;
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
          <li>Se as collections existem</li>
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
