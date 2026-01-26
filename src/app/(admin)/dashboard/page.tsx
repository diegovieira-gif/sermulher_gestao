import { getDashboardStats } from "./actions";
import { OverviewClient } from "./overview-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 1. Busca estatísticas do dashboard
  const statsResult = await getDashboardStats();

  // 2. Busca nome do usuário direto dos cookies (Fonte de verdade da sessão atual)
  const cookieStore = await cookies();
  const userNameCookie = cookieStore.get("user_name");

  // Decodifica o nome (caso tenha acentos ou espaços encodados) ou usa fallback
  const userName = userNameCookie
    ? decodeURIComponent(userNameCookie.value)
    : "Gestão";

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
