import { getDashboardStats } from "./actions";
import { OverviewClient } from "./overview-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { directus } from "@/lib/directus";
import { readMe } from "@directus/sdk";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Busca dados do dashboard e dados do usuário em paralelo para performance
  const [statsResult, userResult] = await Promise.all([
    getDashboardStats(),
    // Tenta buscar o usuário atual. Se falhar (ex: token inválido), retorna null
    directus.request(readMe({ fields: ["first_name"] })).catch(() => null),
  ]);

  // Tenta pegar o usuário real via readMe (mais seguro se tiver auth por cookie)
  let userName = "Gestão";
  try {
    const me = await directus.request(readMe({ fields: ["first_name"] }));
    if (me && me.first_name) {
      userName = me.first_name;
    }
  } catch (e) {
    // Se falhar (ex: token de admin geral), mantemos "Gestão"
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
    <div className="flex-1 p-8 pt-6 bg-gray-50/50 min-h-screen">
      <OverviewClient stats={statsResult.data} userName={userName} />
    </div>
  );
}
