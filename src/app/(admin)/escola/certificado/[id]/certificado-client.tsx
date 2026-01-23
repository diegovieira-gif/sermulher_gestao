"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Printer, FileCheck, AlertCircle } from "lucide-react";
import { CertificateTemplate } from "@/components/escola/certificate-template";

interface CertificadoClientProps {
  matricula: any;
  beneficiaria: any;
  turma: any;
  curso: any;
}

export default function CertificadoClient({
  matricula,
  beneficiaria,
  turma,
  curso,
}: CertificadoClientProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  // Validação: verifica se o status da matrícula é "Concluída"
  const isConcluida =
    matricula?.status?.toLowerCase() === "concluída" ||
    matricula?.status?.toLowerCase() === "concluido";

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `Certificado_${beneficiaria.nome_completo.replace(/\s+/g, "_")}.pdf`,
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
      }
    `,
  });

  const fallbackStart = turma?.data_inicio
    ? new Date(turma.data_inicio)
    : new Date();
  const fallbackEnd = turma?.data_fim
    ? new Date(turma.data_fim)
    : fallbackStart;
  const fallbackInstructor =
    turma?.instrutor_nome || "Instrutor(a) Responsável";

  const certificateData = {
    studentName: beneficiaria.nome_completo,
    studentCpf: beneficiaria.cpf || "---",
    courseName: curso?.nome || "Curso de Formação",
    hours: Number(curso?.carga_horaria) || 0,
    startDate: fallbackStart,
    endDate: fallbackEnd,
    instructorName: fallbackInstructor,
    directorName: undefined,
  };

  if (!isConcluida) {
    return (
      <div className="w-full bg-background min-h-screen p-4 md:p-8">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Certificado Indisponível</AlertTitle>
          <AlertDescription>
            O curso ainda não foi concluído. O certificado só pode ser emitido
            após a conclusão da matrícula com status "Concluída".
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-screen p-4 md:p-8">
      {/* Barra de Ações */}
      <div className="flex gap-3 mb-8 sticky top-8 z-10">
        <Button
          onClick={() => handlePrint()}
          size="lg"
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Printer className="h-5 w-5" />
          Imprimir / Salvar PDF
        </Button>
        <Button variant="outline" size="lg">
          <FileCheck className="h-5 w-5 mr-2" />
          Certificado Liberado
        </Button>
      </div>

      {/* Área de Preview */}
      <div className="flex justify-center bg-gray-100 rounded-lg p-4 md:p-8 print:bg-white print:p-0 print:rounded-none">
        <div className="shadow-lg print:shadow-none">
          <CertificateTemplate ref={certificateRef} data={certificateData} />
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="mt-8 max-w-4xl mx-auto print:hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground uppercase">Aluno</p>
            <p className="font-semibold truncate">
              {beneficiaria.nome_completo}
            </p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground uppercase">Curso</p>
            <p className="font-semibold truncate">
              {certificateData.courseName}
            </p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground uppercase">
              Carga Horária
            </p>
            <p className="font-semibold">{certificateData.hours}h</p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground uppercase">Status</p>
            <p className="font-semibold text-green-600">Concluída</p>
          </div>
        </div>
      </div>
    </div>
  );
}
