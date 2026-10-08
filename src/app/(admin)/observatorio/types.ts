/**
 * Editor do Observatório — espelha o esquema REAL das coleções obser_* no
 * Directus, que é o mesmo que o site público lê (repositório
 * sermulher_observatorio, dados-sermulher.aracaju.se.gov.br):
 *
 * - obser_periodos: um registro por mês; só os `ativo` aparecem no site,
 *   ordenados por `ordem` (AAAAMM).
 * - obser_dashboards: o consolidado do mês — UM por período — com os números
 *   do CRAM e da Secretaria.
 * - séries (atendimentos psicológicos, orientações jurídicas, ouvidoria,
 *   serviços): linhas nome + valor ligadas ao período.
 *
 * Períodos e dashboards têm id UUID; as séries, id numérico.
 */
export type ObserId = string | number;

export type ObserCollection =
  | 'obser_periodos'
  | 'obser_dashboards'
  | 'obser_cram_atendimentos_psicologicos'
  | 'obser_cram_orientacoes_juridicas_distribuicao'
  | 'obser_sermulher_ouvidoria_series'
  | 'obser_sermulher_servicos_distribuicao';

export type TipoCampo = 'text' | 'number' | 'date' | 'boolean' | 'relation';

export interface CampoConfig {
  key: string;
  label: string;
  type: TipoCampo;
  /** O Directus recusa o registro sem ele. */
  required?: boolean;
  /** Aparece como coluna na tabela (o consolidado tem campos demais). */
  listar?: boolean;
  /** Agrupa os campos no formulário. */
  secao?: string;
  dica?: string;
  relationCollection?: 'obser_periodos';
}

export interface CollectionConfig {
  name: ObserCollection;
  label: string;
  fields: CampoConfig[];
  /** Campos de texto em que a busca procura — todos existem na coleção. */
  busca: string[];
  sort: string[];
}

const periodo = (label = 'Período'): CampoConfig => ({
  key: 'periodo_id', label, type: 'relation', relationCollection: 'obser_periodos',
  required: true, listar: true,
});

const numero = (key: string, label: string, secao: string): CampoConfig => ({
  key, label, type: 'number', required: true, secao,
});

const serie = (name: ObserCollection, label: string, rotuloNome: string): CollectionConfig => ({
  name,
  label,
  fields: [
    periodo(),
    { key: 'serie_nome', label: rotuloNome, type: 'text', required: true, listar: true },
    { key: 'valor', label: 'Valor', type: 'number', required: true, listar: true },
    { key: 'ordem', label: 'Ordem no gráfico', type: 'number', listar: true },
  ],
  busca: ['serie_nome'],
  sort: ['ordem', 'id'],
});

export const COLLECTIONS_CONFIG: CollectionConfig[] = [
  {
    name: 'obser_periodos',
    label: 'Períodos',
    fields: [
      { key: 'nome_periodo', label: 'Nome (ex.: Abril 2026)', type: 'text', required: true, listar: true },
      { key: 'data_referencia', label: 'Data de referência', type: 'date', required: true, listar: true, dica: 'Primeiro dia do mês.' },
      { key: 'ordem', label: 'Ordem (AAAAMM)', type: 'number', required: true, listar: true, dica: 'Ex.: 202604. O site mostra os períodos nessa ordem.' },
      { key: 'ativo', label: 'Ativo (aparece no site)', type: 'boolean', listar: true },
    ],
    busca: ['nome_periodo'],
    sort: ['-ordem'],
  },
  {
    name: 'obser_dashboards',
    label: 'Consolidado do mês',
    fields: [
      periodo(),
      { key: 'period_label', label: 'Rótulo no site (ex.: Abril 2026)', type: 'text', required: true, listar: true },
      { key: 'cram_periodo', label: 'Período do CRAM (texto)', type: 'text', required: true, listar: true, dica: 'Como o site descreve o período do CRAM, ex.: Abril de 2026.' },
      numero('cram_mulheres_encaminhadas', 'Mulheres encaminhadas', 'CRAM'),
      numero('cram_mulheres_atendidas', 'Mulheres atendidas', 'CRAM'),
      numero('cram_novos_casos', 'Novos casos', 'CRAM'),
      numero('cram_servicos_realizados', 'Serviços realizados', 'CRAM'),
      numero('cram_rodas_terapeuticas', 'Rodas terapêuticas', 'CRAM'),
      numero('cram_atendimentos_grupo', 'Atendimentos em grupo', 'CRAM'),
      numero('cram_busca_ativa', 'Busca ativa', 'CRAM'),
      numero('cram_atendimentos_recepcao', 'Atendimentos na recepção', 'CRAM'),
      numero('cram_acolhimentos_sociais', 'Acolhimentos sociais', 'CRAM'),
      numero('cram_orientacoes_juridicas_total', 'Orientações jurídicas (total)', 'CRAM'),
      numero('ser_ouvidoria_total_historico', 'Ouvidoria — total histórico', 'Secretaria'),
      numero('ser_sala_azul_encontros_individuais', 'Sala Azul — encontros individuais', 'Secretaria'),
      numero('ser_sala_azul_grupos_reflexivos', 'Sala Azul — grupos reflexivos', 'Secretaria'),
      numero('ser_sala_azul_participantes_medios', 'Sala Azul — participantes (média)', 'Secretaria'),
      numero('ser_servicos_sociais', 'Serviços sociais', 'Secretaria'),
      numero('ser_servicos_psicologicos', 'Serviços psicológicos', 'Secretaria'),
      numero('ser_servicos_juridicos', 'Serviços jurídicos', 'Secretaria'),
      numero('ser_acoes_conscientizacao', 'Ações de conscientização', 'Secretaria'),
      numero('ser_acoes_escutas', 'Escutas', 'Secretaria'),
      numero('ser_acoes_campanhas', 'Campanhas', 'Secretaria'),
      numero('ser_capacitacoes_curso_cuidador', 'Curso de cuidador — capacitadas', 'Secretaria'),
      numero('ser_capacitacoes_feira_expositoras', 'Feira — expositoras', 'Secretaria'),
      { key: 'ser_capacitacoes_centro_vivo_data', label: 'Centro Vivo — data', type: 'date', secao: 'Secretaria' },
    ],
    busca: ['period_label', 'cram_periodo'],
    sort: ['-periodo_id.ordem'],
  },
  serie('obser_cram_atendimentos_psicologicos', 'Atendimentos Psicológicos (CRAM)', 'Tipo de atendimento'),
  serie('obser_cram_orientacoes_juridicas_distribuicao', 'Orientações Jurídicas (CRAM)', 'Área jurídica'),
  serie('obser_sermulher_ouvidoria_series', 'Séries Ouvidoria', 'Mês'),
  serie('obser_sermulher_servicos_distribuicao', 'Distribuição de Serviços', 'Serviço'),
];

export const configDa = (name: ObserCollection): CollectionConfig => {
  const c = COLLECTIONS_CONFIG.find((x) => x.name === name);
  if (!c) throw new Error(`coleção desconhecida: ${name}`);
  return c;
};
