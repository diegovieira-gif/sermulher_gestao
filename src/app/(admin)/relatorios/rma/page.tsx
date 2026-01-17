import { getDadosRMA } from './actions';
import { RMAClient } from './rma-client';

interface PageProps {
  searchParams: Promise<{
    mes?: string;
    ano?: string;
  }>;
}

export default async function RMAPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Valores padrão: mês e ano atuais
  const hoje = new Date();
  const mes = params.mes ? parseInt(params.mes, 10) : hoje.getMonth() + 1;
  const ano = params.ano ? parseInt(params.ano, 10) : hoje.getFullYear();

  // Validação básica
  const mesValido = mes >= 1 && mes <= 12 ? mes : hoje.getMonth() + 1;
  const anoValido = ano >= 2000 && ano <= 2100 ? ano : hoje.getFullYear();

  // Busca dados do RMA
  const result = await getDadosRMA({ mes: mesValido, ano: anoValido });

  if (!result.success) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Erro ao carregar dados do RMA
          </h3>
          <p className="text-destructive mb-2">
            {result.error}
          </p>
          <p className="text-sm text-muted-foreground">
            Verifique se há atendimentos cadastrados para o período selecionado e se os dados estão corretos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Relatório Mensal de Atendimento (RMA)</h1>
        <p className="text-muted-foreground mt-2">
          Visualize as estatísticas e agregações dos atendimentos mensais
        </p>
      </div>

      <RMAClient
        dados={result.data}
        mesInicial={mesValido}
        anoInicial={anoValido}
      />
    </div>
  );
}
