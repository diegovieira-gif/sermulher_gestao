import { getMatriculasByTurma, getTurmaById } from "@/app/(admin)/escola/actions";
import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import CertificadoClient from "./certificado-client";

interface CertificadoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificadoPage({ params }: CertificadoPageProps) {
  const resolvedParams = await params;
  const matriculaId = Number(resolvedParams.id);

  try {
    // Busca os dados da matrícula
    const matriculas = await directus.request(
      readItems("escola_matriculas", {
        filter: {
          id: {
            _eq: matriculaId,
          },
        },
        // @ts-ignore
        fields: [
          "id",
          "beneficiaria.*",
          "turma.id",
          "turma.nome",
          "turma.data_inicio",
          "turma.data_fim",
          "turma.curso.*",
        ],
        limit: 1,
      })
    );

    if (!matriculas || matriculas.length === 0) {
      return (
        <div className="p-6">
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
            Matrícula não encontrada.
          </div>
        </div>
      );
    }

    const matricula = matriculas[0] as any;

    return (
      <CertificadoClient
        matricula={matricula}
        beneficiaria={matricula.beneficiaria}
        turma={matricula.turma}
        curso={matricula.turma.curso}
      />
    );
  } catch (error) {
    console.error("Erro ao carregar certificado:", error);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          Erro ao carregar dados do certificado.
        </div>
      </div>
    );
  }
}
