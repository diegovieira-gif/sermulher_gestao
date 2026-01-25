import { getAuxItems } from "./actions";
import { ConfiguracoesClient } from "./configuracoes-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  // Inicializa arrays vazios
  let origens: any[] = [],
    prioridades: any[] = [],
    tiposEvento: any[] = [],
    tiposAgressao: any[] = [],
    encaminhamentos: any[] = [],
    periculosidade: any[] = [],
    statusLegal: any[] = [],
    locais: any[] = [],
    bairros: any[] = [],
    beneficios: any[] = [],
    campanhas: any[] = [],
    setores: any[] = [];

  try {
    // Busca Paralela (Promise.all) para maior performance em produção
    const results = await Promise.allSettled([
      getAuxItems("config_origens"), // 0
      getAuxItems("config_prioridades"), // 1
      getAuxItems("config_tipos_evento"), // 2
      getAuxItems("config_tipos_agressao"), // 3
      getAuxItems("config_encaminhamentos"), // 4
      getAuxItems("config_niveis_periculosidade"), // 5
      getAuxItems("config_status_legal"), // 6
      getAuxItems("locais"), // 7
      getAuxItems("config_bairros"), // 8
      getAuxItems("config_beneficios"), // 9
      getAuxItems("config_campanhas"), // 10
      getAuxItems("setores"), // 11 (NOVO)
    ]);

    // Helper para extrair dados seguros
    const getData = (index: number) =>
      results[index].status === "fulfilled" && results[index].value.success
        ? results[index].value.data
        : [];

    origens = getData(0);
    prioridades = getData(1);
    tiposEvento = getData(2);
    tiposAgressao = getData(3);
    encaminhamentos = getData(4);
    periculosidade = getData(5);
    statusLegal = getData(6);
    locais = getData(7);
    bairros = getData(8);
    beneficios = getData(9);
    campanhas = getData(10);
    setores = getData(11);
  } catch (error) {
    console.error("Erro crítico ao carregar configurações:", error);
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
        setores={setores}
      />
    </div>
  );
}
