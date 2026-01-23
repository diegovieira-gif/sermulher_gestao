import { getGlobalEvents } from "./actions";
import { EventosCalendarioClient } from "./eventos-calendario-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const result = await getGlobalEvents();

  if (!result.success) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Calendário</AlertTitle>
          <AlertDescription>
            {result.error || "Não foi possível carregar a agenda unificada."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-50/50">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Agenda Institucional
        </h1>
        <p className="text-gray-500">
          Visão unificada de turmas, sessões e eventos.
        </p>
      </div>

      <div className="flex-1">
        <EventosCalendarioClient initialEvents={result.data || []} />
      </div>
    </div>
  );
}
