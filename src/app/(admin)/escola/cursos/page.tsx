import { getCursos } from "../actions";
import { CursosClient } from "./cursos-client";
import type { EscolaCursoDB } from "@/types/database";

export default async function CursosPage() {
  const cursosResult = await getCursos();

  if (!cursosResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          Não foi possível carregar os cursos. Tente novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CursosClient cursos={(cursosResult.data as EscolaCursoDB[]) || []} />
    </div>
  );
}
