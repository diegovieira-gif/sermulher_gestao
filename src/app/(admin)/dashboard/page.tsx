import { getDashboardStats } from "./actions";
import { OverviewClient } from "./overview-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const statsResult = await getDashboardStats();

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="flex-1 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Indisponibilidade Temporária</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os indicadores do sistema.
            <br />
            <span className="text-xs opacity-80">
              Erro:{" "}
              {statsResult.error || "Falha na conexão com o banco de dados."}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-6">
      <OverviewClient stats={statsResult.data} />
    </div>
  );
}
