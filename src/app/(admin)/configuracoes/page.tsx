import { getAuxItems } from "./actions";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  // Busca todos os dados das collections de configuração
  const [
    origensResult,
    prioridadesResult,
    tiposEventoResult,
    tiposAgressaoResult,
    tiposViolenciaResult,
    encaminhamentosResult,
    periculosidadeResult,
    locaisResult,
    bairrosResult,
    beneficiosResult,
  ] =
    await Promise.all([
      getAuxItems("config_origens"),
      getAuxItems("config_prioridades"),
      getAuxItems("config_tipos_evento"),
      getAuxItems("config_tipos_agressao"),
      getAuxItems("config_tipos_violencia"),
      getAuxItems("config_encaminhamentos"),
      getAuxItems("config_niveis_periculosidade"),
      getAuxItems("locais"),
      getAuxItems("config_bairros"),
      getAuxItems("config_beneficios"),
    ]);

  // Verifica se houve erros
  if (
    !origensResult.success ||
    !prioridadesResult.success ||
    !tiposEventoResult.success ||
    !tiposAgressaoResult.success ||
    !tiposViolenciaResult.success ||
    !encaminhamentosResult.success ||
    !periculosidadeResult.success ||
    !locaisResult.success ||
    !bairrosResult.success ||
    !beneficiosResult.success
  ) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
          Erro ao carregar configurações. Tente novamente.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <ConfiguracoesClient
        origens={origensResult.data || []}
        prioridades={prioridadesResult.data || []}
        tiposEvento={tiposEventoResult.data || []}
        tiposAgressao={tiposAgressaoResult.data || []}
        tiposViolencia={tiposViolenciaResult.data || []}
        encaminhamentos={encaminhamentosResult.data || []}
        periculosidade={periculosidadeResult.data || []}
        locais={locaisResult.data || []}
        bairros={bairrosResult.data || []}
        beneficios={beneficiosResult.data || []}
      />
    </div>
  );
}
