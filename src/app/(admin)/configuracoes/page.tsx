import { getAuxItems } from "./actions";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  // Busca todos os dados das collections de configuração usando tipos
  // Cada chamada retorna um array vazio em caso de erro, não quebrando a página
  const [
    origensResult,
    prioridadesResult,
    tiposEventoResult,
    tiposAgressaoResult,
    encaminhamentosResult,
    periculosidadeResult,
    statusLegalResult,
    locaisResult,
    bairrosResult,
    beneficiosResult,
    campanhasResult,
  ] = await Promise.all([
    getAuxItems("origens"),
    getAuxItems("prioridades"),
    getAuxItems("tipos-evento"),
    getAuxItems("tipos-violencia"),
    getAuxItems("encaminhamentos"),
    getAuxItems("periculosidade"),
    getAuxItems("status-legal"),
    getAuxItems("locais"),
    getAuxItems("bairros"),
    getAuxItems("beneficios"),
    getAuxItems("campanhas"),
  ]);

  // Extrai os dados, usando array vazio se houver erro
  // Isso permite que a página carregue mesmo se uma tabela falhar
  return (
    <div className="p-6">
      <ConfiguracoesClient
        origens={origensResult.data || []}
        prioridades={prioridadesResult.data || []}
        tiposEvento={tiposEventoResult.data || []}
        tiposAgressao={tiposAgressaoResult.data || []}
        encaminhamentos={encaminhamentosResult.data || []}
        periculosidade={periculosidadeResult.data || []}
        statusLegal={statusLegalResult.data || []}
        locais={locaisResult.data || []}
        bairros={bairrosResult.data || []}
        beneficios={beneficiosResult.data || []}
        campanhas={campanhasResult.data || []}
      />
    </div>
  );
}
