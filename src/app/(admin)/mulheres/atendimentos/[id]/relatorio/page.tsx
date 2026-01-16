import { notFound } from "next/navigation";
import { getAtendimentoDetails, getTramitacoes } from "../actions";

interface PageProps {
  params: {
    id: string;
  };
}

// Função auxiliar para formatar CPF
function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "";
  const cpfLimpo = cpf.replace(/\D/g, "");
  if (cpfLimpo.length !== 11) return cpf;
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Função auxiliar para formatar data
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateString;
  }
}

// Função auxiliar para formatar data e hora
function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

// Função para formatar data de nascimento
function formatDataNascimento(dataNascimento: string | null | undefined): string {
  if (!dataNascimento) return "-";
  try {
    const date = new Date(dataNascimento);
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dataNascimento;
  }
}

// Função para renderizar relato técnico (com quebra de linha)
function renderRelatoTecnico(relato: string | null): string {
  if (!relato) return "Sem relato técnico.";
  
  // Se contém HTML (rich text), remove tags para impressão
  if (relato.includes("<") && relato.includes(">")) {
    // Remove tags HTML básicas
    const text = relato
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    return text || "Sem relato técnico.";
  }
  
  return relato;
}

export default async function RelatorioPage({ params }: PageProps) {
  const atendimentoId = params.id;

  // Busca dados em paralelo
  const [atendimentoResult, tramitacoesResult] = await Promise.all([
    getAtendimentoDetails(atendimentoId),
    getTramitacoes(atendimentoId),
  ]);

  // Verifica se o atendimento foi encontrado
  if (!atendimentoResult.success || !atendimentoResult.data) {
    notFound();
  }

  const atendimento = atendimentoResult.data;
  const tramitacoes = tramitacoesResult.success ? tramitacoesResult.data : [];

  const beneficiaria = atendimento.beneficiaria;
  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="print-container">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 2cm;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .print-container {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }

          .print-page-break {
            page-break-after: always;
          }

          .print-avoid-break {
            page-break-inside: avoid;
          }
        }

        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 2rem auto;
            padding: 2rem;
            background: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
        }

        .print-container {
          font-family: "Times New Roman", serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
        }

        .print-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #000;
        }

        .print-header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .print-header p {
          font-size: 10pt;
          margin: 0;
        }

        .print-section {
          margin-bottom: 1.5rem;
        }

        .print-section-title {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #ccc;
        }

        .print-card {
          border: 1px solid #ddd;
          padding: 1rem;
          margin-bottom: 1rem;
          border-radius: 4px;
        }

        .print-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .print-field {
          margin-bottom: 0.75rem;
        }

        .print-field-label {
          font-weight: bold;
          font-size: 10pt;
          margin-bottom: 0.25rem;
          color: #555;
        }

        .print-field-value {
          font-size: 11pt;
        }

        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          font-size: 10pt;
        }

        .print-table th,
        .print-table td {
          border: 1px solid #ddd;
          padding: 0.5rem;
          text-align: left;
        }

        .print-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        .print-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }

        .print-signature {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid #000;
        }

        .print-signature-line {
          margin-top: 4rem;
          text-align: center;
        }

        .print-signature-line p {
          margin: 0.5rem 0;
          font-size: 10pt;
        }

        .print-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 9pt;
          font-weight: bold;
        }

        .print-relato {
          white-space: pre-wrap;
          word-wrap: break-word;
          max-width: 100%;
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="print-header">
        <h1>Relatório Técnico de Atendimento - Mulher Protegida</h1>
        <p>Data de emissão: {dataEmissao}</p>
      </div>

      {/* Identificação da Beneficiária */}
      <div className="print-section print-avoid-break">
        <h2 className="print-section-title">Identificação da Beneficiária</h2>
        <div className="print-card">
          <div className="print-grid">
            <div className="print-field">
              <div className="print-field-label">Nome Completo</div>
              <div className="print-field-value">
                {beneficiaria?.nome_completo || "-"}
              </div>
            </div>
            <div className="print-field">
              <div className="print-field-label">CPF</div>
              <div className="print-field-value">
                {formatCPF(beneficiaria?.cpf)}
              </div>
            </div>
            {beneficiaria?.data_nascimento && (
              <div className="print-field">
                <div className="print-field-label">Data de Nascimento</div>
                <div className="print-field-value">
                  {formatDataNascimento(beneficiaria.data_nascimento)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo do Caso */}
      <div className="print-section print-avoid-break">
        <h2 className="print-section-title">Resumo do Caso</h2>
        <div className="print-card">
          <div className="print-grid">
            <div className="print-field">
              <div className="print-field-label">Nº do Atendimento</div>
              <div className="print-field-value">#{atendimento.id}</div>
            </div>
            <div className="print-field">
              <div className="print-field-label">Status</div>
              <div className="print-field-value">
                {atendimento.status || "Não informado"}
              </div>
            </div>
            <div className="print-field">
              <div className="print-field-label">Prioridade</div>
              <div className="print-field-value">
                {atendimento.prioridade_id?.nome || "Não informado"}
              </div>
            </div>
            <div className="print-field">
              <div className="print-field-label">Origem</div>
              <div className="print-field-value">
                {atendimento.origem_id?.nome || "Não informado"}
              </div>
            </div>
            <div className="print-field">
              <div className="print-field-label">Data de Abertura</div>
              <div className="print-field-value">
                {formatDate(atendimento.data_abertura)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Tramitações */}
      <div className="print-section">
        <h2 className="print-section-title">Histórico de Tramitações e Evoluções</h2>
        
        {tramitacoes.length === 0 ? (
          <div className="print-card">
            <p className="text-center" style={{ fontStyle: "italic", color: "#666" }}>
              Nenhuma tramitação registrada ainda.
            </p>
          </div>
        ) : (
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Data</th>
                <th style={{ width: "20%" }}>Tipo de Demanda</th>
                <th style={{ width: "20%" }}>Setor Responsável</th>
                <th style={{ width: "15%" }}>Status</th>
                <th style={{ width: "30%" }}>Relato Técnico</th>
              </tr>
            </thead>
            <tbody>
              {tramitacoes.map((tramitacao) => (
                <tr key={tramitacao.id} className="print-avoid-break">
                  <td>{formatDateTime(tramitacao.data_recebimento)}</td>
                  <td>{tramitacao.tipo_demanda || "-"}</td>
                  <td>{tramitacao.setor_responsavel?.nome || "-"}</td>
                  <td>{tramitacao.status_etapa || "-"}</td>
                  <td>
                    <div className="print-relato">
                      {renderRelatoTecnico(tramitacao.relato_tecnico)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assinatura */}
      <div className="print-signature print-avoid-break">
        <div className="print-signature-line">
          <p>_________________________________</p>
          <p>
            {tramitacoes.length > 0 && tramitacoes[0].usuario_responsavel
              ? `${tramitacoes[0].usuario_responsavel.first_name || ""} ${tramitacoes[0].usuario_responsavel.last_name || ""}`.trim() || "Técnico Responsável"
              : "Técnico Responsável"}
          </p>
          <p style={{ fontSize: "9pt", color: "#666" }}>Assinatura</p>
        </div>
      </div>
    </div>
  );
}
