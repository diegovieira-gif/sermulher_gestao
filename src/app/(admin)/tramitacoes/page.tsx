import { getKanbanData, getSetoresOptions, getStatusEtapasOptions } from "./actions";
import { KanbanBoard } from "./kanban-board";
import { AlertCircle } from "lucide-react";
import { getCurrentAccess } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function TramitacoesPage() {
  // Busca dados iniciais, setores e status de etapa em paralelo
  const [kanbanResult, setores, statusEtapas, access] = await Promise.all([
    getKanbanData(),
    getSetoresOptions(),
    getStatusEtapasOptions(),
    getCurrentAccess(),
  ]);
  // O prontuário exige o módulo "mulheres"; sem ele o link só levaria a erro.
  const podeAbrirProntuario = access.isAdmin || access.allowedKeys.includes("mulheres");

  if (!kanbanResult.success || !kanbanResult.data) {
    return (
      <div className="p-8 flex items-center justify-center text-red-500 gap-2 h-screen">
        <AlertCircle /> Erro ao carregar tramitações. Verifique a conexão.
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 pt-6 h-[calc(100vh-60px)] flex flex-col overflow-hidden">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Fluxo de Trabalho
          </h1>
          <p className="text-muted-foreground">
            Gestão centralizada de demandas e encaminhamentos.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          initialData={kanbanResult.data}
          setores={Array.isArray(setores) ? setores : []}
          statusEtapas={Array.isArray(statusEtapas) ? (statusEtapas as { id: number; nome: string }[]) : []}
          podeAbrirProntuario={podeAbrirProntuario}
        />
      </div>
    </div>
  );
}
