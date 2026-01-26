import { getTurmas, getCursosOptions } from "../actions";
import { TurmasClient } from "./turmas-client";

export const dynamic = "force-dynamic";

export default async function TurmasPage() {
  const [turmasResult, cursosOptionsResult] = await Promise.all([
    getTurmas(),
    getCursosOptions(),
  ]);

  if (!turmasResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          Não foi possível carregar as turmas. Tente novamente.
        </div>
      </div>
    );
  }

  const turmas = (turmasResult.data || []).map((t: any) => ({
    ...t,
    curso_nome: t?.curso?.nome ?? "",
  }));

  const cursoOptions = cursosOptionsResult.success
    ? cursosOptionsResult.data || []
    : [];

  return (
    <div className="p-6">
      <TurmasClient turmas={turmas} cursosOptions={cursoOptions} />
    </div>
  );
}
