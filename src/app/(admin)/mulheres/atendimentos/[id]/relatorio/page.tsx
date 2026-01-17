import { getAtendimentoDetails, getTramitacoes } from "../actions";
import { notFound } from "next/navigation";
import { PrintButton } from "./print-button"; // Importando o componente cliente

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RelatorioAtendimentoPage({ params }: PageProps) {
  const { id } = await params;
  const atendimentoId = Number(id);

  if (isNaN(atendimentoId)) return <div>ID Inválido</div>;

  const [atendimentoRes, tramitacoesRes] = await Promise.all([
    getAtendimentoDetails(atendimentoId),
    getTramitacoes(atendimentoId),
  ]);

  if (!atendimentoRes.success || !atendimentoRes.data) {
    return notFound();
  }

  const atendimento = atendimentoRes.data;
  const mulher = atendimento.beneficiaria;
  const tramitacoes = tramitacoesRes.data || [];

  // Parse seguro de JSONs
  const contato = typeof mulher?.contato === 'string' ? JSON.parse(mulher.contato) : mulher?.contato || {};
  const endereco = typeof mulher?.endereco === 'string' ? JSON.parse(mulher.endereco) : mulher?.endereco || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:bg-white print:p-0">
      
      {/* Botão de Impressão (Componente Isolado) */}
      <div className="mx-auto max-w-[210mm] mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Folha A4 */}
      <div className="mx-auto w-[210mm] min-h-[297mm] bg-white p-[20mm] shadow-lg print:shadow-none print:w-full">
        
        {/* Cabeçalho */}
        <div className="border-b pb-6 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Relatório Técnico</h1>
            <p className="text-sm text-slate-500 mt-1">Acompanhamento Psicossocial e Jurídico</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Protocolo: <strong>#{atendimento.id}</strong></p>
            <p>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* 1. Identificação da Beneficiária */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">Identificação da Beneficiária</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-slate-500 text-xs">Nome Completo</span>
              <span className="font-semibold text-slate-900 text-base">{mulher?.nome_completo}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">CPF</span>
              <span className="font-mono text-slate-900">{mulher?.cpf || "-"}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Telefone</span>
              <span className="text-slate-900">{contato.telefone || "-"}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Data de Nascimento</span>
              <span className="text-slate-900">
                {mulher?.data_nascimento ? new Date(mulher.data_nascimento).toLocaleDateString('pt-BR') : "-"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-500 text-xs">Endereço</span>
              <span className="text-slate-900">
                {endereco.logradouro ? `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro} (${endereco.cidade})` : "-"}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Dados do Atendimento */}
        <section className="mb-8 p-4 bg-slate-50 rounded border border-slate-100 print:bg-transparent print:border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Dados da Abertura</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-slate-500 text-xs">Data de Abertura</span>
              <strong className="text-slate-800">{new Date(atendimento.data_abertura).toLocaleDateString('pt-BR')}</strong>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Origem</span>
              <span className="text-slate-800">{atendimento.origem_id?.nome || "-"}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Prioridade</span>
              <span className="text-slate-800 font-medium">{atendimento.prioridade_id?.nome || "Normal"}</span>
            </div>
          </div>
        </section>

        {/* 3. Evolução (Timeline) */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b pb-1">Histórico de Evolução</h2>
          
          <div className="space-y-6">
            {tramitacoes.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nenhum registro de evolução encontrado.</p>
            ) : (
              tramitacoes.map((t: any) => (
                <div key={t.id} className="relative pl-4 border-l-2 border-slate-200 break-inside-avoid">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.tipo_demanda} 
                      <span className="font-normal text-slate-500 mx-1">•</span> 
                      <span className="font-medium text-slate-600">{t.setor_responsavel?.nome}</span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(t.data_recebimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div 
                    className="text-sm text-slate-700 leading-relaxed text-justify"
                    dangerouslySetInnerHTML={{ __html: t.relato_tecnico }}
                  />
                  <div className="mt-1 text-xs text-slate-400">
                    Responsável: {t.usuario_responsavel?.first_name || "Sistema"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Rodapé / Assinatura */}
        <div className="mt-24 pt-8 border-t border-slate-300 break-inside-avoid">
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="w-64 border-b border-slate-900 mb-2"></div>
              <p className="text-sm font-bold text-slate-900">Técnico Responsável</p>
              <p className="text-xs text-slate-500">Assinatura / Carimbo</p>
            </div>
            <div className="text-xs text-slate-400 text-right">
              <p>SerMulher - Sistema de Gestão</p>
              <p>Documento gerado eletronicamente</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}