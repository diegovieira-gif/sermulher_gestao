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
  const tramitacoes =
    tramitacoesRes.success && tramitacoesRes.data ? tramitacoesRes.data : [];

  // Parse seguro de JSONs
  const contato =
    typeof mulher?.contato === "string"
      ? JSON.parse(mulher.contato)
      : mulher?.contato || {};
  const endereco =
    typeof mulher?.endereco === "string"
      ? JSON.parse(mulher.endereco)
      : mulher?.endereco || {};

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
            <h1 className="text-2xl font-bold text-slate-900">
              Relatório Técnico
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhamento Psicossocial e Jurídico
            </p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>
              Protocolo: <strong>#{atendimento.id}</strong>
            </p>
            <p>Emissão: {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        {/* 1. Identificação da Beneficiária */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">
            Identificação da Beneficiária
          </h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <span className="block text-slate-500 text-xs">
                Nome Completo
              </span>
              <span className="font-semibold text-slate-900 text-base">
                {mulher?.nome_completo}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">CPF</span>
              <span className="font-mono text-slate-900">
                {mulher?.cpf || "-"}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Telefone</span>
              <span className="text-slate-900">{contato.telefone || "-"}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">
                Data de Nascimento
              </span>
              <span className="text-slate-900">
                {mulher?.data_nascimento
                  ? new Date(mulher.data_nascimento).toLocaleDateString("pt-BR")
                  : "-"}
              </span>
            </div>
            <div className="col-span-2">
              <span className="block text-slate-500 text-xs">Endereço</span>
              <span className="text-slate-900">
                {endereco.logradouro
                  ? `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro} (${endereco.cidade})`
                  : "-"}
              </span>
            </div>
          </div>
        </section>

        {/* 2. Dados do Atendimento */}
        <section className="mb-8 p-4 bg-slate-50 rounded border border-slate-100 print:bg-transparent print:border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Dados da Abertura
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-slate-500 text-xs">
                Data de Abertura
              </span>
              <strong className="text-slate-800">
                {atendimento.data_abertura
                  ? new Date(atendimento.data_abertura).toLocaleDateString(
                      "pt-BR",
                    )
                  : "-"}
              </strong>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Origem</span>
              <span className="text-slate-800">
                {atendimento.origem_id?.nome || atendimento.origem || "-"}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs">Prioridade</span>
              <span className="text-slate-800 font-medium">
                {atendimento.prioridade_id?.nome ||
                  atendimento.prioridade ||
                  "Normal"}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Dados Complementares (Socioassistencial e Jurídico) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 break-inside-avoid">
          {/* Socioassistencial */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">
              Dados Socioassistenciais
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-slate-500 text-xs">
                  Gestante ou Puérpera
                </span>
                <span className="text-slate-900 font-medium">
                  {atendimento.gestante_puerpera ? "Sim" : "Não"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="block text-slate-500 text-xs">
                  Necessidades Sociais
                </span>
                <div className="mt-1 text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded text-xs min-h-[40px]">
                  {atendimento.necessidades_sociais || "Nenhuma registrada."}
                </div>
              </div>
            </div>
          </section>

          {/* Jurídico */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">
              Dados Jurídicos
            </h2>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-slate-500 text-xs">
                    Boletim de Ocorrência
                  </span>
                  <span className="text-slate-900 font-medium">
                    {atendimento.boletim_ocorrencia || "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs">
                    Medida Protetiva
                  </span>
                  <span className="text-slate-900 font-medium">
                    {atendimento.medida_protetiva ? "Sim" : "Não"}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-slate-500 text-xs">
                  Tipos de Violência
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {atendimento.tipos_violencia_lista &&
                  atendimento.tipos_violencia_lista.length > 0 ? (
                    atendimento.tipos_violencia_lista.map(
                      (item: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                        >
                          {item.config_tipos_agressao_id?.nome ||
                            "Violência não especificada"}
                        </span>
                      ),
                    )
                  ) : atendimento.tipos_violencia ? (
                    // Fallback para campo de texto antigo
                    atendimento.tipos_violencia.split(",").map((v: string) => (
                      <span
                        key={v}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                      >
                        {v.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">
                      Nenhum tipo registrado
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="block text-slate-500 text-xs">
                  Necessidades Jurídicas
                </span>
                <div className="mt-1 text-slate-800 whitespace-pre-wrap bg-slate-50 p-2 rounded text-xs min-h-[40px]">
                  {atendimento.necessidades_juridicas || "Nenhuma registrada."}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 4. Avaliação de Risco */}
        {atendimento.avaliacao_risco &&
          Object.keys(atendimento.avaliacao_risco).length > 0 && (
            <section className="mb-8 break-inside-avoid">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b pb-1">
                Avaliação de Risco
              </h2>
              <div className="bg-red-50 border border-red-100 rounded p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {Object.entries(atendimento.avaliacao_risco).map(
                    ([key, value]) => {
                      const labelMap: Record<string, string> = {
                        violencia_aumentando: "A violência está aumentando?",
                        filhos_com_agressor: "Possui filhos com o agressor?",
                        conflito_guarda: "Há conflito sobre guarda dos filhos?",
                        tentou_separar: "Tentou se separar recentemente?",
                        agressor_persegue: "O agressor persegue a vítima?",
                        agressor_armas: "O agressor possui armas de fogo?",
                        agressor_drogas: "O agressor faz uso de drogas/álcool?",
                        agressor_ameaca_morte: "O agressor ameaçou de morte?",
                      };
                      const label = labelMap[key] || key.replace(/_/g, " ");

                      if (value === "Não se aplica") return null;

                      return (
                        <div
                          key={key}
                          className="flex justify-between items-center border-b border-red-100/50 py-1 last:border-0"
                        >
                          <span className="text-slate-700">{label}</span>
                          <span
                            className={`font-medium ${value === "Sim" ? "text-red-700" : "text-slate-600"}`}
                          >
                            {String(value)}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </section>
          )}

        {/* 3. Evolução (Timeline) */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 border-b pb-1">
            Histórico de Evolução
          </h2>

          <div className="space-y-6">
            {tramitacoes.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                Nenhum registro de evolução encontrado.
              </p>
            ) : (
              tramitacoes.map((t: any) => (
                <div
                  key={t.id}
                  className="relative pl-4 border-l-2 border-slate-200 break-inside-avoid"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.tipo_demanda}
                      <span className="font-normal text-slate-500 mx-1">•</span>
                      <span className="font-medium text-slate-600">
                        {t.setor_responsavel?.nome}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(t.data_recebimento).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div
                    className="text-sm text-slate-700 leading-relaxed text-justify"
                    dangerouslySetInnerHTML={{ __html: t.relato_tecnico }}
                  />
                  <div className="mt-1 text-xs text-slate-400">
                    Responsável:{" "}
                    {t.usuario_responsavel?.first_name || "Sistema"}
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
              <p className="text-sm font-bold text-slate-900">
                Técnico Responsável
              </p>
              <p className="text-xs text-slate-500">Assinatura / Carimbo</p>
            </div>
            <div className="text-xs text-slate-400 text-right">
              <p>SERMULHER - Sistema de Gestão</p>
              <p>Documento gerado eletronicamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
