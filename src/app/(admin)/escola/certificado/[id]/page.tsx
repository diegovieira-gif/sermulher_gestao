import { notFound } from "next/navigation";
import { directus } from "@/lib/directus";
import { readItem } from "@directus/sdk";
import CertificateTemplate from "@/components/escola/certificate-template";
import { Button } from "@/components/ui/button";
import { AlertCircle, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import CertificadoClient from "./certificado-client"; // Wrapper cliente para impressão

// Força a página a ser dinâmica para não cachear status antigo
export const dynamic = "force-dynamic";

export default async function CertificadoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  try {
    // 1. Busca os dados com TODOS os campos necessários
    const matricula = await directus.request(
      readItem("escola_matriculas", id, {
        fields: [
          "*",
          "beneficiaria.*",
          "turma.*",
          "turma.curso.*",
          // Importante: garantir que turma.status venha na query
        ],
      }),
    );

    // ---------------------------------------------------------
    // 🚨 ÁREA DE DEBUG: Olhe o terminal do VS Code quando rodar
    // ---------------------------------------------------------
    console.log("================ DEBUG CERTIFICADO ================");
    console.log(`Matrícula ID: ${id}`);
    console.log(`Status Aluna (Banco): "${matricula.status}"`);
    console.log(`Status Turma (Banco): "${matricula.turma?.status}"`);
    console.log("===================================================");

    if (!matricula) {
      return notFound();
    }

    // 2. Normalização e Validação
    const statusAluna = matricula.status?.toString().toLowerCase().trim() || "";
    const statusTurma =
      matricula.turma?.status?.toString().toLowerCase().trim() || "";

    // Regras (Baseadas no snapshot.json):
    // Aluna: "aprovada"
    // Turma: "concluida" (ou concluída)
    const isAlunaAprovada = [
      "aprovada",
      "concluida",
      "concluída",
      "approved",
    ].includes(statusAluna);
    const isTurmaConcluida = ["concluida", "concluída", "finalizada"].includes(
      statusTurma,
    );

    // 3. Tratamento de Erros Específico
    if (!isAlunaAprovada) {
      return (
        <ErrorScreen
          title="Certificado Indisponível"
          message={`A aluna não está aprovada. Status atual: "${matricula.status}". Altere para "Aprovada" na lista de alunas.`}
        />
      );
    }

    if (!isTurmaConcluida) {
      return (
        <ErrorScreen
          title="Turma em Andamento"
          message={`A turma ainda não foi finalizada no sistema. Status atual: "${matricula.turma?.status}". O certificado só é liberado após a conclusão da turma.`}
        />
      );
    }

    // 4. Renderizar cliente (dados já validados no servidor)
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
        <CertificadoClient
          matricula={matricula}
          beneficiaria={matricula.beneficiaria}
          turma={matricula.turma}
          curso={matricula.turma?.curso}
        />
      </div>
    );
  } catch (error) {
    console.error("Erro ao gerar certificado:", error);
    return (
      <ErrorScreen
        title="Erro Técnico"
        message="Não foi possível carregar os dados do certificado. Verifique o console."
      />
    );
  }
}

// Componente simples de erro visual
function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg border border-red-100">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600">{message}</p>
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => {
              // Tenta fechar a aba se foi aberta como popup, senão volta
              if (window.opener) window.close();
              else window.history.back();
            }}
          >
            Voltar / Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
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
        fields: [
          "id",
          "status",
          "beneficiaria.*",
          "turma.id",
          "turma.status",
          "turma.curso.*",
        ],
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

    // 1. Normalização dos Status (blindagem contra maiúsculas/acentos)
    const statusTurma =
      matricula.turma?.status?.toString().toLowerCase().trim() || "";
    const statusMatricula =
      matricula.status?.toString().toLowerCase().trim() || "";

    // 2. Regras de Negócio (baseadas no snapshot.json)
    // Turma deve estar 'concluida' (aceita variações visuais)
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
              Fechar
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
              Fechar
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
