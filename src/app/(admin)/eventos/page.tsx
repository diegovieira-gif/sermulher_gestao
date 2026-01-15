import { getEventos } from "./actions";
import { EventosClient } from "./eventos-client";

export default async function EventosPage() {
  const result = await getEventos();

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          {result.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <EventosClient eventos={result.data || []} />
    </div>
  );
}
