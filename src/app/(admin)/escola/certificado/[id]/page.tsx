import { directus } from "@/lib/directus";
import { readItems } from "@directus/sdk";
import CertificadoClient from "./certificado-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    // Normaliza o status para evitar erros de Case Sensitive ou Acentos
    const status = matricula.status?.toString().toLowerCase().trim() || "";
    const statusValidos = ["aprovada", "concluida", "concluída", "approved"];

    if (!statusValidos.includes(status)) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Certificado Indisponível</AlertTitle>
            <AlertDescription>
              O status atual da matrícula é{" "}
              <strong>"{matricula.status}"</strong>. O certificado só pode ser
              emitido para alunas com status <strong>"Aprovada"</strong>.
              <div className="mt-4">
                <Button variant="outline" onClick={() => window.history.back()}>
                  Voltar
                </Button>
              </div>
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
