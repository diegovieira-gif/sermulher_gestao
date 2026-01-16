import { getCertificadoData } from "./actions";
import { AlertCircle } from "lucide-react";
import { PrintButton } from "./print-button"; // Importando o componente cliente

interface PageProps {
  params: Promise<{
    participacaoId: string;
  }>;
}

export default async function CertificadoPage({ params }: PageProps) {
  const { participacaoId } = await params;
  const result = await getCertificadoData(participacaoId);

  if (!result.success || !result.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Não foi possível gerar</h2>
          </div>
          <p className="text-gray-600">{result.error}</p>
        </div>
      </div>
    );
  }

  const p = result.data;
  const infrator = p.infrator;
  const sala = p.sala;
  
  // Formatação de datas
  const formatDate = (dateStr: string) => 
    new Date(dateStr).toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' });

  const responsavel = sala.responsavel_tecnico 
    ? `${sala.responsavel_tecnico.first_name} ${sala.responsavel_tecnico.last_name}`
    : "Coordenação Técnica";

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
      {/* Botão de Imprimir (Visível apenas na tela) */}
      <div className="mx-auto mb-8 flex max-w-[297mm] justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Folha A4 Paisagem */}
      <div className="mx-auto aspect-[297/210] w-[297mm] bg-white p-12 shadow-2xl print:w-full print:shadow-none print:m-0 print:p-8">
        <div className="flex h-full flex-col justify-between border-[12px] border-double border-slate-800 p-16">
          
          {/* Cabeçalho */}
          <div className="text-center">
            <h1 className="font-serif text-6xl font-bold tracking-wider text-slate-900 uppercase">
              Certificado
            </h1>
            <p className="mt-4 text-xl font-light tracking-widest text-slate-500 uppercase">
              de Conclusão
            </p>
          </div>

          {/* Corpo do Texto */}
          <div className="my-12 px-8 text-justify font-serif text-2xl leading-relaxed text-slate-800">
            <p>
              Certificamos que <strong className="uppercase">{infrator.nome_completo}</strong>, 
              portador(a) do CPF nº <strong>{infrator.cpf || "não informado"}</strong>, 
              participou com êxito do Grupo Reflexivo <strong>{sala.nome_ciclo}</strong>.
            </p>
            <p className="mt-8">
              As atividades foram realizadas no período de <strong>{formatDate(sala.data_inicio)}</strong> a <strong>{formatDate(sala.data_termino)}</strong>, 
              cumprindo a carga horária e frequência exigidas pelo programa.
            </p>
          </div>

          {/* Assinaturas */}
          <div className="mt-auto grid grid-cols-2 gap-16 pt-16">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-px w-full bg-slate-400"></div>
              <p className="font-bold text-slate-900">{responsavel}</p>
              <p className="text-sm text-slate-500">Responsável Técnico</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 h-px w-full bg-slate-400"></div>
              <p className="font-bold text-slate-900">Coordenação Sala Azul</p>
              <p className="text-sm text-slate-500">Gestão do Programa</p>
            </div>
          </div>

          {/* Rodapé / Autenticação */}
          <div className="mt-12 text-center text-xs text-slate-400">
            <p>Este documento comprova a participação para fins judiciais.</p>
            <p>Registro: {p.id} • Emitido em: {new Date().toLocaleDateString("pt-BR")}</p>
          </div>

        </div>
      </div>

      {/* Estilos específicos para impressão */}
      <style>{`
        @page {
          size: landscape;
          margin: 0;
        }
        @media print {
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}