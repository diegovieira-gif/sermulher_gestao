import { getAuxItems } from "./actions";
import { ConfiguracoesClient } from "./configuracoes-client";

export default async function ConfiguracoesPage() {
  // Inicializa arrays vazios
  let origens = [],
    prioridades = [],
    tiposEvento = [],
    tiposAgressao = [],
    encaminhamentos = [],
    periculosidade = [],
    statusLegal = [],
    locais = [],
    bairros = [],
    beneficios = [],
    campanhas = [];

  try {
    // Busca Sequencial (Um por vez para não afogar a conexão)
    // Cada requisição completa antes da próxima iniciar

    console.log("[Configurações] Iniciando carregamento de dados...");

    // 1. Origens
    let r1 = await getAuxItems("config_origens");
    if (r1.success) {
      origens = r1.data;
      console.log("[Configurações] ✓ Origens carregadas");
    } else {
      console.error("[Configurações] ✗ Erro ao carregar origens:", r1.error);
    }

    // 2. Prioridades
    let r2 = await getAuxItems("config_prioridades");
    if (r2.success) {
      prioridades = r2.data;
      console.log("[Configurações] ✓ Prioridades carregadas");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar prioridades:",
        r2.error,
      );
    }

    // 3. Tipos de Evento
    let r3 = await getAuxItems("config_tipos_evento");
    if (r3.success) {
      tiposEvento = r3.data;
      console.log("[Configurações] ✓ Tipos de evento carregados");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar tipos de evento:",
        r3.error,
      );
    }

    // 4. Tipos de Agressão
    let r4 = await getAuxItems("config_tipos_agressao");
    if (r4.success) {
      tiposAgressao = r4.data;
      console.log("[Configurações] ✓ Tipos de agressão carregados");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar tipos de agressão:",
        r4.error,
      );
    }

    // 5. Encaminhamentos
    let r5 = await getAuxItems("config_encaminhamentos");
    if (r5.success) {
      encaminhamentos = r5.data;
      console.log("[Configurações] ✓ Encaminhamentos carregados");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar encaminhamentos:",
        r5.error,
      );
    }

    // 6. Niveis de Periculosidade
    let r6 = await getAuxItems("config_niveis_periculosidade");
    if (r6.success) {
      periculosidade = r6.data;
      console.log("[Configurações] ✓ Níveis de periculosidade carregados");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar níveis de periculosidade:",
        r6.error,
      );
    }

    // 7. Status Legal
    let r7 = await getAuxItems("config_status_legal");
    if (r7.success) {
      statusLegal = r7.data;
      console.log("[Configurações] ✓ Status legal carregado");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar status legal:",
        r7.error,
      );
    }

    // 8. Locais (CRÍTICO)
    let r8 = await getAuxItems("locais");
    if (r8.success) {
      locais = r8.data;
      console.log("[Configurações] ✓ Locais carregados");
    } else {
      console.error(
        "[Configurações] ✗ Erro crítico ao carregar locais:",
        r8.error,
      );
    }

    // 9. Bairros
    let r9 = await getAuxItems("config_bairros");
    if (r9.success) {
      bairros = r9.data;
      console.log("[Configurações] ✓ Bairros carregados");
    } else {
      console.error("[Configurações] ✗ Erro ao carregar bairros:", r9.error);
    }

    // 10. Beneficios
    let r10 = await getAuxItems("config_beneficios");
    if (r10.success) {
      beneficios = r10.data;
      console.log("[Configurações] ✓ Benefícios carregados");
    } else {
      console.error(
        "[Configurações] ✗ Erro ao carregar benefícios:",
        r10.error,
      );
    }

    // 11. Campanhas
    let r11 = await getAuxItems("config_campanhas");
    if (r11.success) {
      campanhas = r11.data;
      console.log("[Configurações] ✓ Campanhas carregadas");
    } else {
      console.error("[Configurações] ✗ Erro ao carregar campanhas:", r11.error);
    }

    console.log("[Configurações] ✓ Carregamento completo com sucesso");
  } catch (error) {
    console.error(
      "[Configurações] Erro crítico ao carregar configurações:",
      error,
    );
    // Não retorna erro de UI, retorna dados parciais para permitir navegação
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie as tabelas auxiliares e parâmetros do sistema.
        </p>
      </div>

      <ConfiguracoesClient
        origens={origens}
        prioridades={prioridades}
        tiposEvento={tiposEvento}
        tiposAgressao={tiposAgressao}
        encaminhamentos={encaminhamentos}
        periculosidade={periculosidade}
        statusLegal={statusLegal}
        locais={locais}
        bairros={bairros}
        beneficios={beneficios}
        campanhas={campanhas}
      />
    </div>
  );
}
