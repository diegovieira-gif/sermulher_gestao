import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import CertificadoClient from "./certificado-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CertificadoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CertificadoPage({
  params,
}: CertificadoPageProps) {
  const resolvedParams = await params;
  const matriculaId = Number(resolvedParams.id);

  try {
    // Busca os dados da matrícula com todos os campos relacionados
    const matriculas = await directus.request(
      readItems("escola_matriculas", {
        filter: {
          id: {
            _eq: matriculaId,
          },
        },
        // @ts-ignore
        fields: ["id", "status", "beneficiaria.*", "turma.id", "turma.curso.*"],
        limit: 1,
      }),
    );

    if (!matriculas || matriculas.length === 0) {
      return (
        <div className="p-6 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Matrícula não encontrada</AlertTitle>
            <AlertDescription>
              O ID de matrícula fornecido não existe no sistema.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    const matricula = matriculas[0] as any;

    // Validação: permite certificado para status Concluída ou Aprovada
    const normalizedStatus = (matricula?.status || "").toString().toLowerCase();
    const isElegivel = [
      "concluída",
      "concluido",
      "concluida",
      "aprovada",
    ].includes(normalizedStatus);

    if (!isElegivel) {
      return (
        <div className="p-6 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Certificado Indisponível</AlertTitle>
            <AlertDescription>
              A matrícula está com status "{matricula.status}". O certificado só
              pode ser emitido quando o status for "Concluída" ou "Aprovada".
            </AlertDescription>
          </Alert>
        </div>
      );
    }

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
      <div className="p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Erro ao carregar certificado</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
