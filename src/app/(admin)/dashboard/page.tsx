import { getDashboardStats } from "./actions";
import { DashboardClient } from "./dashboard-client";
import { SmartAssistant } from "@/components/smart-assistant";

export default async function DashboardPage() {
  try {
    // Verificar configuração
    if (!process.env.NEXT_PUBLIC_DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
      return (
        <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm text-orange-800">
            ⚠️ <strong>Modo de demonstração:</strong> Conecte-se ao Directus
            para ver dados reais.
          </p>
        </div>
      );
    }

    // Busca dados do Dashboard
    const stats = await getDashboardStats();

    // Renderiza o Dashboard
    return (
      <div className="space-y-6">
        <SmartAssistant />
        <DashboardClient stats={stats} />
      </div>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao buscar dados do dashboard:", errorMessage);

    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Erro ao carregar dashboard
        </h3>
        <p className="text-destructive mb-2">
          Não foi possível carregar os dados. Verifique:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>
            Se o Directus está rodando (
            {process.env.NEXT_PUBLIC_DIRECTUS_URL || "URL não configurada"})
          </li>
          <li>Se as variáveis de ambiente estão configuradas (.env.local)</li>
          <li>Se o token de acesso é válido</li>
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
