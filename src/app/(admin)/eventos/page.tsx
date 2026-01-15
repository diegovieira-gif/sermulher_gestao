import { getEventos, getTiposOptions } from "./actions";
import { EventosClient } from "./eventos-client";

export default async function EventosPage() {
  const tiposOptions = await getTiposOptions();
  const eventosResult = await getEventos();

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
      <EventosClient
        eventos={eventosResult.data || []}
        tiposEventoOptions={tiposOptions.data || []}
      />
    </div>
  );
}
