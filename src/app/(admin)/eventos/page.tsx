import { getEventos, getTiposOptions } from "./actions";
import { EventosClient } from "./eventos-client";
import { EventosCalendarioClient } from "./eventos-calendario-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EventosPage() {
  const tiposOptions = await getTiposOptions();
  const eventosResult = await getEventos();

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

  return (
    <div className="p-6">
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          <EventosClient
            eventos={eventosResult.data || []}
            tiposEventoOptions={tiposOptions.data || []}
          />
        </TabsContent>

        <TabsContent value="calendario" className="space-y-4">
          <EventosCalendarioClient
            eventos={eventosResult.data || []}
            tiposEventoOptions={tiposOptions.data || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
