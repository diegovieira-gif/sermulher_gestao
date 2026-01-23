"use client";

import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CertificateTemplateProps {
  data: {
    studentName: string;
    studentCpf: string;
    courseName: string;
    hours: number;
    startDate: string | Date;
    endDate: string | Date;
    instructorName?: string;
    directorName?: string;
  };
}

export const CertificateTemplate = forwardRef<
  HTMLDivElement,
  CertificateTemplateProps
>(({ data }, ref) => {
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const startFormatted = formatDate(data.startDate);
  const endFormatted = formatDate(data.endDate);

  return (
    <div
      ref={ref}
      className="w-full bg-white print:bg-white"
      style={{
        width: "297mm",
        height: "210mm",
        padding: "40px",
        boxSizing: "border-box",
        fontFamily: '"Georgia", "Times New Roman", serif',
      }}
    >
      {/* Container Principal */}
      <div className="h-full flex flex-col items-center justify-center relative">
        {/* Borda Ornamental */}
        <div className="absolute inset-0 border-2 border-amber-900/40 pointer-events-none" />
        <div className="absolute inset-1 border border-amber-900/20 pointer-events-none" />

        {/* Conteúdo */}
        <div className="relative z-10 w-full max-w-4xl text-center space-y-6">
          {/* Logo/Cabeçalho */}
          <div className="space-y-2 mb-8">
            <div className="text-5xl font-bold text-amber-900 tracking-wider">
              SER MULHER
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-amber-600 mx-auto rounded-full" />
            <p className="text-sm text-amber-900/60 tracking-wide">
              Projeto de Empoderamento e Gestão
            </p>
          </div>

          {/* Título Principal */}
          <div className="space-y-4 my-10">
            <h1 className="text-4xl font-bold text-amber-900 tracking-wide">
              CERTIFICADO DE CONCLUSÃO
            </h1>
            <div className="flex justify-center gap-2">
              <div className="w-12 h-0.5 bg-amber-900/30" />
              <div className="w-12 h-0.5 bg-amber-900/30" />
              <div className="w-12 h-0.5 bg-amber-900/30" />
            </div>
          </div>

          {/* Texto Principal */}
          <div className="space-y-6 my-10 text-justify px-8">
            <p className="text-base leading-relaxed text-gray-800">
              Certificamos que{" "}
              <span className="font-bold text-amber-900">
                {data.studentName}
              </span>
              , portadora do CPF{" "}
              <span className="font-bold text-amber-900">
                {data.studentCpf}
              </span>
              , concluiu com êxito o curso de{" "}
              <span className="font-bold text-amber-900 italic">
                {data.courseName}
              </span>
              , oferecido pelo projeto SER MULHER, cumprindo todas as exigências
              curriculares e demonstrando competência nas habilidades
              desenvolvidas durante o período de realização do curso.
            </p>
          </div>

          {/* Dados do Curso */}
          <div className="grid grid-cols-3 gap-8 my-10 px-8">
            <div className="space-y-1 border-t-2 border-amber-900/30 pt-4">
              <p className="text-xs text-amber-900/70 uppercase tracking-widest font-semibold">
                Carga Horária
              </p>
              <p className="text-lg font-semibold text-amber-900">
                {data.hours}h
              </p>
            </div>

            <div className="space-y-1 border-t-2 border-amber-900/30 pt-4">
              <p className="text-xs text-amber-900/70 uppercase tracking-widest font-semibold">
                Período
              </p>
              <p className="text-sm font-semibold text-amber-900">
                {startFormatted.split(" ")[0]} - {endFormatted.split(" ")[0]}
              </p>
            </div>

            <div className="space-y-1 border-t-2 border-amber-900/30 pt-4">
              <p className="text-xs text-amber-900/70 uppercase tracking-widest font-semibold">
                Data de Emissão
              </p>
              <p className="text-sm font-semibold text-amber-900">
                {endFormatted}
              </p>
            </div>
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-3 gap-12 mt-16 px-8">
            {/* Diretora */}
            <div className="space-y-2">
              <div className="h-16 flex items-end justify-center">
                <div className="w-full border-t-2 border-gray-800" />
              </div>
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                Diretora do Projeto
              </p>
              <p className="text-xs text-gray-600">SER MULHER</p>
            </div>

            {/* Carimbo/Espaço */}
            <div className="space-y-2 flex flex-col items-center justify-end">
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                CARIMBO
              </div>
            </div>

            {/* Instrutora */}
            <div className="space-y-2">
              <div className="h-16 flex items-end justify-center">
                <div className="w-full border-t-2 border-gray-800" />
              </div>
              <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">
                {data.instructorName ? "Instrutora" : "Instrutor/a"}
              </p>
              {data.instructorName && (
                <p className="text-xs text-gray-600">{data.instructorName}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de Impressão */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          * {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
});

CertificateTemplate.displayName = "CertificateTemplate";
