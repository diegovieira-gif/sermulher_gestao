import { getDashboardStats } from "./actions";
import { OverviewClient } from "./overview-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getDirectusClient, safeDirectusCall } from "@/lib/directus";
import { readMe } from "@directus/sdk";
import { mesAtualEmBrasilia } from "@/lib/datas";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}) {
  const sp = await searchParams;
  // Mês corrente no calendário de Brasília (o servidor pode estar em UTC).
  const agora = mesAtualEmBrasilia();
  const mes = Number(sp.mes) || agora.mes;
  const ano = Number(sp.ano) || agora.ano;

  // 1. Busca estatísticas do dashboard (período selecionado ou mês corrente)
  const statsResult = await getDashboardStats({ mes, ano });

  // 2. Busca dados do usuário autenticado via Directus
  let userName = "Gestão";
  const user = await safeDirectusCall(async () => {
    const directus = await getDirectusClient({ requireAuth: true });

    return directus.request(readMe({ fields: ["first_name"] }));
  });

  if (user?.first_name) {
    userName = user.first_name;
  }

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {statsResult.error ||
              "Não foi possível carregar os dados do dashboard."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 pt-6 bg-background min-h-screen">
      <OverviewClient
        stats={statsResult.data}
        userName={userName}
        mesReferencia={mes}
        anoReferencia={ano}
      />
    </div>
  );
}
