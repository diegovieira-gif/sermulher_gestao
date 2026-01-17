import { getEventos, getTiposOptions, getAgendaEvents } from "./actions";
import { EventosClient } from "./eventos-client";
import { AgendaClient } from "./agenda-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EventosPage() {
  const tiposOptions = await getTiposOptions();
  const eventosResult = await getEventos();
  const agendaResult = await getAgendaEvents();

  // Tratamento de erros para eventos
  if (!eventosResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {eventosResult.error}
        </div>
      </div>
    );
  }

  if (!tiposOptions.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {tiposOptions.error || "Erro ao carregar opções. Tente novamente."}
        </div>
      </div>
    );
  }

  // Para a agenda, não bloqueamos a página se houver erro, apenas mostramos mensagem
  const agendaEvents = agendaResult.success ? agendaResult.data : [];

  return (
    <div className="p-6">
      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="eventos">Eventos e Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          {!agendaResult.success && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
              {agendaResult.error || "Erro ao carregar agenda. Tente novamente."}
            </div>
          )}
          <AgendaClient events={agendaEvents} />
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <EventosClient
            eventos={eventosResult.data || []}
            tiposEventoOptions={tiposOptions.data || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
