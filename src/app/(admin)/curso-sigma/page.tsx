import { getCurrentAccess } from "@/lib/permissions";
import { getCurso, getProgressoEquipe } from "./actions";
import { CursoClient } from "./curso-client";

export const dynamic = "force-dynamic";

export default async function CursoSigmaPage({
  searchParams,
}: {
  searchParams: Promise<{ aula?: string }>;
}) {
  const [{ aula }, curso, access] = await Promise.all([searchParams, getCurso(), getCurrentAccess()]);
  const equipe = access.isAdmin ? await getProgressoEquipe() : null;

  if (!curso.success) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          {curso.error}
        </div>
      </div>
    );
  }

  return (
    <CursoClient
      aulas={curso.aulas}
      progressoInicial={curso.progresso}
      aulaInicial={aula ? Number(aula) : null}
      equipe={equipe?.success ? equipe.data : null}
      erroEquipe={equipe && !equipe.success ? equipe.error : null}
    />
  );
}
