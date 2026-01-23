"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Printer, FileCheck } from "lucide-react";
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

  // Fallbacks seguros para dados que podem não existir no banco ainda
  const fallbackStart = turma?.data_inicio
    ? new Date(turma.data_inicio)
    : new Date();

  const fallbackEnd = turma?.data_fim
    ? new Date(turma.data_fim)
    : fallbackStart;

  const fallbackInstructor = turma?.instrutor_nome || "Coordenação Pedagógica";

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

  return (
    <div className="w-full bg-background min-h-screen p-4 md:p-8">
      {/* Barra de Ações */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 sticky top-8 z-10 print:hidden justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 text-green-700">
          <FileCheck className="h-5 w-5" />
          <span className="font-medium">Status: Aprovada</span>
        </div>

        <Button
          onClick={() => handlePrint()}
          size="lg"
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all hover:scale-105 w-full md:w-auto"
        >
          <Printer className="h-5 w-5" />
          Imprimir / Baixar PDF
        </Button>
      </div>

      {/* Área de Preview */}
      <div className="flex justify-center bg-gray-100 rounded-lg p-4 md:p-8 print:bg-white print:p-0 print:rounded-none overflow-auto border border-gray-200">
        <div className="shadow-2xl print:shadow-none bg-white origin-top scale-90 md:scale-100 transition-transform">
          <CertificateTemplate ref={certificateRef} data={certificateData} />
        </div>
      </div>

      {/* Informações de Rodapé (Apenas Tela) */}
      <div className="mt-8 max-w-4xl mx-auto print:hidden opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-center text-xs text-gray-400">
          Este documento é gerado automaticamente com base nos registros do
          sistema.
        </p>
      </div>
    </div>
  );
}
