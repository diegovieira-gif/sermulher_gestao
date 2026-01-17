import { getMulheresDashboardStats } from "./actions";
import { DashboardClient } from "./dashboard-client";
import { Button } from "@/components/ui/button";
import { UserPlus, FileText } from "lucide-react";
import Link from "next/link";

export default async function MulheresPage() {
  const statsResult = await getMulheresDashboardStats();

  if (!statsResult.success) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Erro ao carregar dashboard
        </h3>
        <p className="text-destructive mb-2">
          Não foi possível carregar os dados do módulo Mulheres.
        </p>
        <p className="text-sm text-muted-foreground">
          {statsResult.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Botões de Acesso Rápido */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Gestão de Mulheres
          </h1>
          <p className="text-muted-foreground">
            Painel de controle e indicadores do módulo
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/mulheres/beneficiarias">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Nova Beneficiária
            </Button>
          </Link>
          <Link href="/mulheres/atendimentos">
            <Button className="bg-pink-600 hover:bg-pink-700">
              <FileText className="h-4 w-4 mr-2" />
              Novo Atendimento
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard com Estatísticas */}
      <DashboardClient stats={statsResult.data} />
    </div>
  );
}
