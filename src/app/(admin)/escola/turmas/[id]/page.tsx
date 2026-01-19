import { getTurmaById, getMatriculasByTurma, getBeneficiariasOptions } from "../../actions";
import { TurmaDetalhesClient } from "./turma-detalhes-client";

interface TurmaDetalhesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TurmaDetalhesPage({ params }: TurmaDetalhesPageProps) {
  const resolvedParams = await params;
  const turmaId = Number(resolvedParams.id);

  // Busca turma, matrículas e beneficiárias em paralelo
  const [turmaResult, matriculasResult, beneficiariasResult] = await Promise.all([
    getTurmaById(turmaId),
    getMatriculasByTurma(turmaId),
    getBeneficiariasOptions(),
  ]);

  // Se a turma não existir, mostra erro
  if (!turmaResult.success) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          Turma não encontrada. <a href="/admin/escola/turmas" className="underline">Voltar</a>
        </div>
      </div>
    );
  }

  const turma = turmaResult.data;
  const matriculas = matriculasResult.success ? matriculasResult.data || [] : [];
  const beneficiarias = beneficiariasResult.success ? beneficiariasResult.data || [] : [];

  return (
    <div className="p-6">
      <TurmaDetalhesClient
        turma={turma}
        matriculas={matriculas}
        beneficiarias={beneficiarias}
      />
    </div>
  );
}
