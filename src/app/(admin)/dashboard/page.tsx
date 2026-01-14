import { directus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { DashboardCharts } from './dashboard-charts';

interface Atendimento {
  id: string;
  data_atendimento: string;
  setor_responsavel?: {
    nome: string;
  };
}

// Função auxiliar para agrupar atendimentos por mês
function agruparAtendimentosPorMes(atendimentos: Atendimento[]) {
  const mesesMap: Record<string, number> = {};
  
  atendimentos.forEach((atendimento) => {
    if (atendimento.data_atendimento) {
      const data = new Date(atendimento.data_atendimento);
      const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      mesesMap[mesAno] = (mesesMap[mesAno] || 0) + 1;
    }
  });

  // Converter para array e ordenar por data
  return Object.entries(mesesMap)
    .map(([month, atendimentos]) => ({ month, atendimentos }))
    .slice(-6); // Últimos 6 meses
}

// Função auxiliar para distribuir por setores
function distribuirPorSetores(atendimentos: Atendimento[]) {
  const setoresMap: Record<string, number> = {};
  
  atendimentos.forEach((atendimento) => {
    const setor = atendimento.setor_responsavel?.nome || 'Não especificado';
    setoresMap[setor] = (setoresMap[setor] || 0) + 1;
  });

  const cores = ['#9333ea', '#f97316', '#3b82f6', '#10b981', '#ef4444'];
  
  return Object.entries(setoresMap).map(([name, value], index) => ({
    name,
    value,
    color: cores[index % cores.length],
  }));
}

export default async function DashboardPage() {
  // Dados mock como fallback
  const mockData = {
    beneficiarias: [],
    atendimentos: [],
    infratores: [],
    eventos: [],
  };

  let usandoDadosMock = false;

  try {
    // Verificar configuração
    if (!process.env.NEXT_PUBLIC_DIRECTUS_URL || !process.env.DIRECTUS_TOKEN) {
      console.warn('⚠️ Variáveis de ambiente do Directus não configuradas. Usando dados mock.');
      usandoDadosMock = true;
      throw new Error('Variáveis de ambiente do Directus não configuradas');
    }

    console.log('📊 Buscando dados do Directus...');

    // Buscar dados em paralelo do Directus
    const [beneficiarias, atendimentos, infratores, eventos] = await Promise.all([
      directus.request(readItems('beneficiarias', { limit: -1 })).catch(err => {
        console.error('❌ Erro ao buscar beneficiarias:', err);
        return [];
      }),
      directus.request(
        readItems('atendimentos', {
          limit: -1,
          fields: ['*', 'setor_responsavel.*'],
        })
      ).catch(err => {
        console.error('❌ Erro ao buscar atendimentos:', err);
        return [];
      }),
      directus.request(readItems('infratores', { limit: -1 })).catch(err => {
        console.error('❌ Erro ao buscar infratores:', err);
        return [];
      }),
      directus.request(
        readItems('eventos_campanhas', {
          limit: -1,
        })
      ).catch(err => {
        console.error('❌ Erro ao buscar eventos:', err);
        return [];
      }),
    ]);

    mockData.beneficiarias = beneficiarias as any[];
    mockData.atendimentos = atendimentos as any[];
    mockData.infratores = infratores as any[];
    mockData.eventos = eventos as any[];

    console.log('✅ Dados carregados:', {
      beneficiarias: mockData.beneficiarias.length,
      atendimentos: mockData.atendimentos.length,
      infratores: mockData.infratores.length,
      eventos: mockData.eventos.length,
    });

    // Calcular totais
    const totalBeneficiarias = mockData.beneficiarias.length;
    const totalAtendimentos = mockData.atendimentos.length;
    const totalInfratores = mockData.infratores.length;
    const totalEventos = mockData.eventos.length;

    // Processar dados para os gráficos
    const atendimentosPorMes = agruparAtendimentosPorMes(mockData.atendimentos as Atendimento[]);
    const distribuicaoSetores = distribuirPorSetores(mockData.atendimentos as Atendimento[]);

    // Se não há dados, usar dados de exemplo
    const finalAtendimentosPorMes = atendimentosPorMes.length > 0 
      ? atendimentosPorMes 
      : [
          { month: 'Jan', atendimentos: 0 },
          { month: 'Fev', atendimentos: 0 },
          { month: 'Mar', atendimentos: 0 },
        ];

    const finalDistribuicaoSetores = distribuicaoSetores.length > 0
      ? distribuicaoSetores
      : [
          { name: 'Sem dados', value: 1, color: '#9333ea' },
        ];

    return (
      <>
        {usandoDadosMock && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>Modo de demonstração:</strong> Conecte-se ao Directus para ver dados reais.
            </p>
          </div>
        )}
        <DashboardCharts
          totalBeneficiarias={totalBeneficiarias}
          totalAtendimentos={totalAtendimentos}
          totalInfratores={totalInfratores}
          totalEventos={totalEventos}
          atendimentosPorMes={finalAtendimentosPorMes}
          distribuicaoSetores={finalDistribuicaoSetores}
        />
      </>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar dados do dashboard:', errorMessage);
    console.error('Detalhes do erro:', error);
    console.error('Directus URL:', process.env.NEXT_PUBLIC_DIRECTUS_URL);
    console.error('Token configurado:', !!process.env.DIRECTUS_TOKEN);
    
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Erro ao carregar dashboard
        </h3>
        <p className="text-destructive mb-2">
          Não foi possível carregar os dados. Verifique:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Se o Directus está rodando ({process.env.NEXT_PUBLIC_DIRECTUS_URL || 'URL não configurada'})</li>
          <li>Se as variáveis de ambiente estão configuradas (.env.local)</li>
          <li>Se o token de acesso é válido</li>
          <li>Se as collections (beneficiarias, atendimentos, infratores, eventos_campanhas) existem</li>
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-destructive hover:underline">
            Ver detalhes técnicos
          </summary>
          <pre className="mt-2 p-3 bg-destructive/5 rounded text-xs overflow-auto">
            {errorMessage}
          </pre>
        </details>
      </div>
    );
  }
}
