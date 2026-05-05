import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CertificateTemplateProps {
  data: {
    studentName: string;
    studentCpf: string;
    courseName: string;
    hours: number | string;
    startDate: Date | string;
    endDate: Date | string;
    instructorName?: string;
    directorName?: string;
  };
}

export const CertificateTemplate = forwardRef<
  HTMLDivElement,
  CertificateTemplateProps
>(({ data }, ref) => {
  // Formatação de datas
  const formatDate = (date: Date | string) => {
    if (!date) return "--/--/----";
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div
      ref={ref}
      className="w-[297mm] h-[210mm] bg-white p-8 mx-auto relative text-black"
    >
      {/* Borda Ornamental */}
      <div className="w-full h-full border-[12px] border-double border-purple-900 p-8 flex flex-col justify-between relative bg-white">
        {/* Elementos Decorativos de Canto */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-purple-600" />
        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-purple-600" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-purple-600" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-purple-600" />

        {/* Cabeçalho */}
        <header className="text-center mt-8">
          <h1 className="text-6xl font-serif font-bold text-purple-800 tracking-wide mb-2">
            SERMULHER
          </h1>
          <h2 className="text-xl uppercase tracking-widest text-gray-600 font-semibold border-b-2 border-purple-200 inline-block pb-2 px-8">
            Secretaria Municipal do Respeito às Políticas para as Mulheres
          </h2>
        </header>

        {/* Título Principal */}
        <div className="text-center my-8">
          <h3 className="text-5xl font-serif text-purple-900 italic font-bold decoration-double">
            Certificado de Conclusão
          </h3>
        </div>

        {/* Corpo do Texto */}
        <div className="text-center px-12 space-y-6">
          <p className="text-xl leading-relaxed text-gray-800 font-serif">
            Certificamos para os devidos fins que
          </p>

          <div className="text-4xl font-bold text-purple-900 border-b border-gray-300 pb-2 mx-12 font-serif italic">
            {data.studentName}
          </div>

          <p className="text-lg leading-relaxed text-gray-700 max-w-4xl mx-auto">
            inscrita no CPF nº <strong>{data.studentCpf}</strong>, concluiu com
            êxito o curso de qualificação profissional em
          </p>

          <div className="text-3xl font-bold text-purple-800 my-2 font-serif">
            {data.courseName}
          </div>

          <p className="text-lg leading-relaxed text-gray-700 max-w-5xl mx-auto">
            promovido pelo projeto <strong>SERMULHER</strong>, realizado no
            período de <strong>{formatDate(data.startDate)}</strong> a{" "}
            <strong>{formatDate(data.endDate)}</strong>, com carga horária total
            de <strong>{data.hours} horas</strong>.
          </p>
        </div>

        {/* Data e Local */}
        <div className="text-center mt-8 mb-12">
          <p className="text-lg text-gray-600">
            Aracaju,{" "}
            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
          </p>
        </div>

        {/* Assinaturas */}
        <div className="flex justify-around items-end mb-12 px-16">
          <div className="text-center w-64">
            <div className="border-b border-black mb-2 h-10" />
            <p className="font-bold text-purple-900">{data.instructorName}</p>
            <p className="text-xs text-gray-500 uppercase">
              Coordenação Pedagógica
            </p>
          </div>

          <div className="text-center w-64">
            <div className="border-b border-black mb-2 h-10" />
            <p className="font-bold text-purple-900">Diretoria SERMULHER</p>
            <p className="text-xs text-gray-500 uppercase">
              Secretaria Municipal do Respeito às Políticas para as Mulheres
            </p>
          </div>
        </div>

        {/* Rodapé / Validação */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-[10px] text-gray-400">
            Este certificado tem validade para fins curriculares de
            aperfeiçoamento profissional. Sistema de Gestão Integrada SERMULHER.
          </p>
        </div>
      </div>
    </div>
  );
});

CertificateTemplate.displayName = "CertificateTemplate";
