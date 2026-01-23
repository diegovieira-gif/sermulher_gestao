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
    const data = matricula;

    // Normaliza o status para garantir a validação (remove espaços e caixa alta/baixa)
    const statusAtual = data?.status?.toString().toLowerCase().trim();

    // Lista de status que permitem a emissão do certificado
    // "aprovada" é o padrão do banco, "concluida" é um fallback
    const statusPermitidos = ["aprovada", "concluida", "concluída"];

    if (!statusPermitidos.includes(statusAtual)) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
          <div className="max-w-md text-center">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Certificado Indisponível</AlertTitle>
              <AlertDescription>
                A matrícula está com status <strong>"{data?.status}"</strong>.
                <br />O certificado só pode ser emitido para alunas com status{" "}
                <strong>"Aprovada"</strong>.
              </AlertDescription>
            </Alert>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => window.close()}
            >
              Fechar Janela
            </Button>
          </div>
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
