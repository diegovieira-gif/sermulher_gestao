import { notFound } from "next/navigation";
import { getRelatorioIndividual } from "./actions";
import { PrintButton } from "./print-button";

interface PageProps {
  params: Promise<{
    id: string;
    participacaoId: string;
  }>;
}

export default async function RelatorioPage({ params }: PageProps) {
  const { id, participacaoId } = await params;

  const result = await getRelatorioIndividual(id, participacaoId);

  if (!result.success || !result.data) {
    notFound();
  }

  const { ciclo, participante, sessoes, resumo } = result.data;

  // Função para formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      {/* Botão de Imprimir - Fica fixo no canto (some na impressão) */}
      <PrintButton />

      {/* Container do Relatório - Layout minimalista */}
      <div className="min-h-screen bg-white p-8 print:p-4">
        {/* Cabeçalho */}
        <div className="text-center mb-8 print:mb-6">
          <h1 className="text-2xl font-bold text-black print:text-xl mb-2">
            Relatório de Acompanhamento - Grupo Reflexivo
          </h1>
          <div className="h-px bg-black my-4"></div>
        </div>

        {/* Dados do Infrator e do Ciclo */}
        <div className="mb-8 print:mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 print:gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
                Participante:
              </h2>
              <p className="text-base text-black print:text-sm">
                {participante.nome}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
                CPF:
              </h2>
              <p className="text-base text-black print:text-sm">
                {participante.cpf}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
              Número do Processo:
            </h2>
            <p className="text-base text-black print:text-sm">
              {participante.numero_processo}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 print:gap-3 mt-4 pt-4 border-t border-gray-300">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
                Ciclo/Grupo:
              </h2>
              <p className="text-base text-black print:text-sm">
                {ciclo.nome}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
                Período:
              </h2>
              <p className="text-base text-black print:text-sm">
                {formatDate(ciclo.data_inicio)} a {formatDate(ciclo.data_fim)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 print:gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
                Local:
              </h2>
              <p className="text-base text-black print:text-sm">
                {ciclo.local}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 print:text-xs mb-1">
                Responsável Técnico:
              </h2>
              <p className="text-base text-black print:text-sm">
                {ciclo.responsavel}
              </p>
            </div>
          </div>
        </div>

        {/* Resumo de Frequência */}
        <div className="mb-8 print:mb-6 p-4 border border-gray-300 print:border-black bg-gray-50 print:bg-white">
          <h2 className="text-lg font-bold text-black print:text-base mb-2">
            Resumo de Frequência
          </h2>
          <p className="text-base text-black print:text-sm">
            <strong>Frequência:</strong> {resumo.percentualFrequencia}% (
            {resumo.qtdPresente}/{resumo.totalSessoes})
          </p>
          <p className="text-sm text-gray-700 print:text-xs mt-1">
            Total de Sessões: {resumo.totalSessoes} | Presentes:{" "}
            {resumo.qtdPresente} | Ausentes: {resumo.qtdAusente}
          </p>
        </div>

        {/* Tabela Detalhada */}
        <div className="mb-8 print:mb-6">
          <h2 className="text-lg font-bold text-black print:text-base mb-4 print:mb-3">
            Detalhamento de Sessões
          </h2>
          <table className="w-full border-collapse border border-gray-400 print:border-black">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-200">
                <th className="border border-gray-400 print:border-black p-3 print:p-2 text-left text-sm font-bold text-black print:text-xs">
                  Data
                </th>
                <th className="border border-gray-400 print:border-black p-3 print:p-2 text-left text-sm font-bold text-black print:text-xs">
                  Tema
                </th>
                <th className="border border-gray-400 print:border-black p-3 print:p-2 text-center text-sm font-bold text-black print:text-xs">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {sessoes.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="border border-gray-400 print:border-black p-3 print:p-2 text-center text-gray-500 print:text-black"
                  >
                    Nenhuma sessão cadastrada
                  </td>
                </tr>
              ) : (
                sessoes.map((sessao) => (
                  <tr key={sessao.id}>
                    <td className="border border-gray-400 print:border-black p-3 print:p-2 text-sm text-black print:text-xs">
                      {formatDate(sessao.data)}
                    </td>
                    <td className="border border-gray-400 print:border-black p-3 print:p-2 text-sm text-black print:text-xs">
                      {sessao.tema}
                    </td>
                    <td
                      className={`border border-gray-400 print:border-black p-3 print:p-2 text-center text-sm font-semibold print:text-xs ${
                        sessao.presente
                          ? "text-green-700 print:text-black"
                          : "text-red-700 print:text-black font-bold"
                      }`}
                    >
                      {sessao.presente ? "Presente" : "Ausente"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé - Espaço para Assinatura */}
        <div className="mt-12 print:mt-8 pt-8 print:pt-6 border-t border-gray-300 print:border-black">
          <div className="text-center">
            <p className="text-base text-black print:text-sm mb-12 print:mb-8">
              _________________________________________
            </p>
            <p className="text-base font-semibold text-black print:text-sm">
              {ciclo.responsavel}
            </p>
            <p className="text-sm text-gray-700 print:text-xs mt-1">
              Responsável Técnico
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
