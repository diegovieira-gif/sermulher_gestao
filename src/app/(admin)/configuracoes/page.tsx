import { getAuxItems } from "./actions";
import { ConfiguracoesClient } from "./configuracoes-client";

/**
 * Função auxiliar para buscar dados com tratamento de erro individual
 * Retorna array vazio se falhar, permitindo que a página continue funcionando
 */
async function safeGetAuxItems(type: string, isCritical: boolean = false) {
  try {
    const result = await getAuxItems(type);
    if (!result.success && isCritical) {
      console.error(`Erro crítico ao buscar ${type}:`, result.error);
    }
    return result.data || [];
  } catch (error) {
    console.error(`Erro ao buscar ${type}:`, error);
    if (isCritical) {
      console.error(`Falha crítica em ${type} - a página pode não funcionar corretamente`);
    }
    return [];
  }
}

export default async function ConfiguracoesPage() {
  // Buscas críticas (sequencial para garantir conexão estável)
  const origensResult = await safeGetAuxItems("origens", true);
  const locaisResult = await safeGetAuxItems("locais", true);

  // Buscas secundárias (sequencial para evitar sobrecarga de conexão)
  // Cada uma é independente - se uma falhar, as outras continuam
  const prioridadesResult = await safeGetAuxItems("prioridades");
  const tiposEventoResult = await safeGetAuxItems("tipos-evento");
  const tiposAgressaoResult = await safeGetAuxItems("tipos-violencia");
  const encaminhamentosResult = await safeGetAuxItems("encaminhamentos");
  const periculosidadeResult = await safeGetAuxItems("periculosidade");
  const statusLegalResult = await safeGetAuxItems("status-legal");
  const bairrosResult = await safeGetAuxItems("bairros");
  const beneficiosResult = await safeGetAuxItems("beneficios");
  const campanhasResult = await safeGetAuxItems("campanhas");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
      <p className="text-muted-foreground mb-6">
        Gerencie as tabelas auxiliares do sistema
      </p>
      <ConfiguracoesClient
        origens={origensResult}
        prioridades={prioridadesResult}
        tiposEvento={tiposEventoResult}
        tiposAgressao={tiposAgressaoResult}
        encaminhamentos={encaminhamentosResult}
        periculosidade={periculosidadeResult}
        statusLegal={statusLegalResult}
        locais={locaisResult}
        bairros={bairrosResult}
        beneficios={beneficiosResult}
        campanhas={campanhasResult}
      />
    </div>
  );
}
