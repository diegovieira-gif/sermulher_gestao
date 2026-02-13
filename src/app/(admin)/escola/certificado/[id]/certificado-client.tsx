"use client";

import { Printer, FileCheck } from "lucide-react";
import { CertificateTemplate } from "@/components/escola/certificate-template";
import { PrintButton } from "./print-button";

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
    <div className="w-full bg-background min-h-screen p-4 md:p-8 relative">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white;
            margin: 0;
            padding: 0;
            overflow: hidden; /* Evita que outras partes apareçam */
          }
          /* Oculta tudo que não seja o certificado */
          body > *:not(.certificate-container) {
            display: none !important;
          }
          /* Garante que o container do certificado seja visível */
          .certificate-container {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            background: white;
          }
          /* Adapta o template para preencher a tela na impressão */
          .certificate-template-wrapper {
             width: 100%;
             height: 100%;
             display: flex;
             align-items: center;
             justify-content: center;
          }
        }
      `}</style>

      {/* Barra de Ações */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 sticky top-8 z-10 print:hidden justify-between items-center bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 text-green-700">
          <FileCheck className="h-5 w-5" />
          <span className="font-medium">Status: Aprovada</span>
        </div>

        <PrintButton />
      </div>

      {/* Área de Preview */}
      <div className="flex justify-center bg-gray-100 rounded-lg p-4 md:p-8 print:p-0 print:bg-white print:rounded-none overflow-auto border border-gray-200 certificate-container">
        <div className="shadow-2xl print:shadow-none bg-white origin-top scale-90 md:scale-100 transition-transform certificate-template-wrapper">
          <CertificateTemplate data={certificateData} />
        </div>
      </div>

      {/* Informações de Rodapé (Apenas Tela) */}
      <div className="mt-8 max-w-4xl mx-auto print:hidden opacity-70 hover:opacity-100 transition-opacity">
        <p className="text-center text-xs text-gray-400">
          Este documento é gerado automaticamente com base nos registros do
          sistema. Para imprimir, utilize o botão acima e certifique-se de configurar a impressora para "Paisagem".
        </p>
      </div>
    </div>
  );
}
