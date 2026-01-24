import { getKanbanData, getSetoresOptions } from "./actions";
import { KanbanBoard } from "./kanban-board";
import { AlertCircle } from "lucide-react";

export default async function TramitacoesPage() {
  // Busca dados iniciais e lista de setores em paralelo
  const [kanbanResult, setores] = await Promise.all([
    getKanbanData(),
    getSetoresOptions(),
  ]);

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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
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
        />
      </div>
    </div>
  );
}
