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

export const dynamic = "force-dynamic";

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
        fields: [
          "id",
          "status",
          "beneficiaria.*", // Traz nome e CPF da aluna
          "turma.id",
          "turma.status",
          "turma.curso.*", // Traz nome do curso e carga horária
          // REMOVIDOS: instrutor_nome, data_inicio, data_fim (não existem no banco ainda)
        ],
        limit: 1,
      }),
    );

    if (!matriculas || matriculas.length === 0) {
      return (
        <div className="p-6 max-w-2xl mx-auto mt-10">
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

    // 1. Normalização dos Status (blindagem contra maiúsculas/acentos)
    const statusTurma =
      matricula.turma?.status?.toString().toLowerCase().trim() || "";
    const statusMatricula =
      matricula.status?.toString().toLowerCase().trim() || "";

    // 2. Regras de Negócio
    // Turma deve estar 'concluida' (aceita variações visuais do banco)
    const isTurmaConcluida = ["concluida", "concluída", "finalizada"].includes(
      statusTurma,
    );

    // Aluna deve estar 'aprovada'
    const isAlunaAprovada = ["aprovada", "approved"].includes(statusMatricula);

    // 3. Verificação e Mensagens de Erro Precisas
    if (!isTurmaConcluida) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
          <div className="max-w-md text-center p-6 bg-white rounded-lg shadow-sm border">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Turma em Andamento</AlertTitle>
              <AlertDescription>
                Esta turma ainda não foi finalizada (Status atual:{" "}
                <strong>{matricula.turma?.status}</strong>).
                <br />O certificado só estará disponível após a conclusão da
                turma pelo instrutor.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => window.close()}>
              Fechar Janela
            </Button>
          </div>
        </div>
      );
    }

    if (!isAlunaAprovada) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
          <div className="max-w-md text-center p-6 bg-white rounded-lg shadow-sm border">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Certificado Indisponível</AlertTitle>
              <AlertDescription>
                A aluna não possui status de aprovação (Status atual:{" "}
                <strong>{matricula.status}</strong>).
                <br />
                Certifique-se de alterar o status para{" "}
                <strong>"Aprovada"</strong> na lista de alunas.
              </AlertDescription>
            </Alert>
            <Button variant="outline" onClick={() => window.close()}>
              Fechar Janela
            </Button>
          </div>
        </div>
      );
    }

    // Renderiza o cliente (que usará data de hoje e instrutor genérico como fallback)
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
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Erro Técnico</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os dados. Verifique se o banco de dados
            está acessível.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
