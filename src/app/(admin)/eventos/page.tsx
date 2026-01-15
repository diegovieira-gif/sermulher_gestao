import { getEventos, getTiposEventoOptions } from "./actions";
import { EventosClient } from "./eventos-client";

export default async function EventosPage() {
  const [eventosResult, tiposEventoResult] = await Promise.all([
    getEventos(),
    getTiposEventoOptions(),
  ]);

  if (!eventosResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {eventosResult.error}
        </div>
      </div>
    );
  }

  if (!tiposEventoResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {tiposEventoResult.error || "Erro ao carregar opções. Tente novamente."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EventosClient
        eventos={eventosResult.data || []}
        tiposEventoOptions={tiposEventoResult.data || []}
      />
    </div>
  );
}
