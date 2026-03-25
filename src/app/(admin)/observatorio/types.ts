
export interface ObserBase {
  id: number;
  status: string;
  ordem?: number;
}

export interface ObserPeriodo extends ObserBase {
  nome: string;
}

export interface ObserDashboard extends ObserBase {
  titulo: string;
  url: string;
}

export interface ObserCramAtendimentoPsicologico extends ObserBase {
  periodo_id?: number | ObserPeriodo;
  serie_nome: string;
  valor: number;
}

export interface ObserCramOrientacaoJuridica extends ObserBase {
  periodo_id?: number | ObserPeriodo;
  serie_nome: string;
  valor: number;
}

export interface ObserOuvidoriaSerie extends ObserBase {
  periodo_id?: number | ObserPeriodo;
  serie_nome: string;
  valor: number;
}

export interface ObserServicosDistribuicao extends ObserBase {
  periodo_id?: number | ObserPeriodo;
  serie_nome: string;
  valor: number;
}

export type ObserCollection = 
  | 'obser_periodos'
  | 'obser_dashboards'
  | 'obser_cram_atendimentos_psicologicos'
  | 'obser_cram_orientacoes_juridicas_distribuicao'
  | 'obser_sermulher_ouvidoria_series'
  | 'obser_sermulher_servicos_distribuicao';

export interface CollectionConfig {
  name: ObserCollection;
  label: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'url' | 'select' | 'relation';
    relationCollection?: string;
  }[];
}

export const COLLECTIONS_CONFIG: CollectionConfig[] = [
  {
    name: 'obser_periodos',
    label: 'Períodos',
    fields: [
      { key: 'nome', label: 'Nome (Ex: Jan/2024)', type: 'text' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
      { key: 'status', label: 'Status', type: 'text' },
    ]
  },
  {
    name: 'obser_dashboards',
    label: 'Dashboards',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text' },
      { key: 'url', label: 'URL do Dashboard', type: 'url' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
      { key: 'status', label: 'Status', type: 'text' },
    ]
  },
  {
    name: 'obser_cram_atendimentos_psicologicos',
    label: 'Atendimentos Psicólogos (CRAM)',
    fields: [
      { key: 'serie_nome', label: 'Nome da Série', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'periodo_id', label: 'Período', type: 'relation', relationCollection: 'obser_periodos' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
    ]
  },
  {
    name: 'obser_cram_orientacoes_juridicas_distribuicao',
    label: 'Orientações Jurídicas (CRAM)',
    fields: [
      { key: 'serie_nome', label: 'Nome da Série', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'periodo_id', label: 'Período', type: 'relation', relationCollection: 'obser_periodos' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
    ]
  },
  {
    name: 'obser_sermulher_ouvidoria_series',
    label: 'Séries Ouvidoria',
    fields: [
      { key: 'serie_nome', label: 'Nome da Série', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'periodo_id', label: 'Período', type: 'relation', relationCollection: 'obser_periodos' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
    ]
  },
  {
    name: 'obser_sermulher_servicos_distribuicao',
    label: 'Distribuição de Serviços',
    fields: [
      { key: 'serie_nome', label: 'Nome da Série', type: 'text' },
      { key: 'valor', label: 'Valor', type: 'number' },
      { key: 'periodo_id', label: 'Período', type: 'relation', relationCollection: 'obser_periodos' },
      { key: 'ordem', label: 'Ordem', type: 'number' },
    ]
  }
];
