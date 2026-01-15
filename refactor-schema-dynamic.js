// Refatoracao de enums estaticos para tabelas dinamicas (Directus)
// Uso: DIRECTUS_URL=... DIRECTUS_ADMIN_TOKEN=... node refactor-schema-dynamic.js
// Etapas: (1) cria collections config_*, (2) popula seeds, (3) adiciona relacionamentos M2O/M2M nas tabelas principais.

import {
  createDirectus,
  rest,
  staticToken,
  createCollection,
  createField,
  createItem,
  readCollection,
  readField,
  readItems
} from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://192.168.0.115:8055';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'j8EbY77uaPAhN0ZnGrDvoQI9VUGTvl_7';

const directus = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function hasCollection(name) {
  try {
    await directus.request(readCollection(name));
    return true;
  } catch (err) {
    return false;
  }
}

async function hasField(collection, field) {
  try {
    await directus.request(readField(collection, field));
    return true;
  } catch (err) {
    return false;
  }
}

async function ensureCollection(collection, meta = {}, schema = {}) {
  if (await hasCollection(collection)) {
    console.log(`✅ Collection '${collection}' ja existe`);
    return false;
  }
  await directus.request(createCollection({ collection, meta, schema }));
  console.log(`✅ Collection '${collection}' criada`);
  return true;
}

async function ensureField(collection, fieldConfig) {
  if (await hasField(collection, fieldConfig.field)) {
    console.log(`  → Campo ${collection}.${fieldConfig.field} ja existe`);
    return false;
  }
  await directus.request(createField(collection, fieldConfig));
  console.log(`  ✓ Campo ${collection}.${fieldConfig.field} criado`);
  return true;
}

async function ensureSeed(collection, items) {
  for (const item of items) {
    try {
      const existing = await directus.request(
        readItems(collection, { filter: { nome: { _eq: item.nome } }, limit: 1 })
      );
      if (existing?.length) {
        console.log(`  → Seed ignorado em '${collection}': ${item.nome}`);
        continue;
      }
      await directus.request(createItem(collection, item));
      console.log(`  ✓ Seed criado em '${collection}': ${item.nome}`);
    } catch (err) {
      console.error(`  ✗ Erro ao seedar '${collection}' (${item.nome}): ${err.message}`);
    }
  }
}

async function ensureRelation(payload) {
  try {
    await directus.request(createItem('directus_relations', payload));
    console.log('  ✓ Relacao criada');
    return true;
  } catch (err) {
    if (err?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE' || `${err.message}`.includes('RECORD_NOT_UNIQUE')) {
      console.log('  → Relacao ja existe');
      return false;
    }
    console.error(`  ✗ Erro ao criar relacao: ${err.message}`);
    return false;
  }
}

const configCollections = [
  {
    name: 'config_origens',
    meta: { icon: 'list', display_template: '{{nome}}', sort: 201 },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } }
    ],
    seed: [
      { nome: 'Recepção' },
      { nome: 'Ouvidoria' },
      { nome: 'Busca Ativa' }
    ]
  },
  {
    name: 'config_prioridades',
    meta: { icon: 'flag', display_template: '{{nome}}', sort: 202 },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'cor', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: true } },
      { field: 'nivel', type: 'integer', meta: { interface: 'input' }, schema: { is_nullable: true } }
    ],
    seed: [
      { nome: 'Normal', cor: 'Azul', nivel: 1 },
      { nome: 'Urgente', cor: 'Laranja', nivel: 2 },
      { nome: 'Emergência', cor: 'Vermelho', nivel: 3 }
    ]
  },
  {
    name: 'config_tipos_evento',
    meta: { icon: 'event', display_template: '{{nome}}', sort: 203 },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'icone', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: true } }
    ],
    seed: [
      { nome: 'Campanha', icone: 'campaign' },
      { nome: 'Curso', icone: 'school' },
      { nome: 'Palestra', icone: 'record_voice_over' },
      { nome: 'Mutirão', icone: 'groups' }
    ]
  },
  {
    name: 'config_status_legal',
    meta: { icon: 'gavel', display_template: '{{nome}}', sort: 204 },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } }
    ],
    seed: [
      { nome: 'Em cumprimento' },
      { nome: 'Concluído' },
      { nome: 'Reincidente' }
    ]
  },
  {
    name: 'config_niveis_periculosidade',
    meta: { icon: 'warning', display_template: '{{nome}}', sort: 205 },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'cor', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: true } },
      { field: 'peso', type: 'integer', meta: { interface: 'input' }, schema: { is_nullable: true } }
    ],
    seed: [
      { nome: 'Baixo', cor: 'Verde', peso: 1 },
      { nome: 'Médio', cor: 'Amarelo', peso: 2 },
      { nome: 'Alto', cor: 'Laranja', peso: 3 },
      { nome: 'Crítico', cor: 'Vermelho', peso: 4 }
    ]
  },
  {
    name: 'config_tipos_agressao',
    meta: { icon: 'report', display_template: '{{nome}}', sort: 206 },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } }
    ],
    seed: [
      { nome: 'Física' },
      { nome: 'Psicológica' },
      { nome: 'Moral' },
      { nome: 'Sexual' },
      { nome: 'Patrimonial' }
    ]
  }
];

async function etapa1Collections() {
  console.log('\n==== ETAPA 1: Collections de configuracao ====');
  for (const cfg of configCollections) {
    await ensureCollection(cfg.name, cfg.meta, cfg.schema || {});
    for (const field of cfg.fields) {
      await ensureField(cfg.name, field);
    }
  }
}

async function etapa2Seeds() {
  console.log('\n==== ETAPA 2: Seed das config_* ====');
  for (const cfg of configCollections) {
    await ensureSeed(cfg.name, cfg.seed);
  }
}

async function etapa3Relacionamentos() {
  console.log('\n==== ETAPA 3: Relacionamentos nas tabelas principais ====');

  // atendimentos -> config_origens
  await ensureField('atendimentos', {
    field: 'origem_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Origem (config_origens)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'atendimentos',
    field: 'origem_id',
    related_collection: 'config_origens',
    meta: { one_field: 'atendimentos' }
  });

  // atendimentos -> config_prioridades
  await ensureField('atendimentos', {
    field: 'prioridade_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Prioridade (config_prioridades)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'atendimentos',
    field: 'prioridade_id',
    related_collection: 'config_prioridades',
    meta: { one_field: 'atendimentos' }
  });

  // eventos_campanhas -> config_tipos_evento
  await ensureField('eventos_campanhas', {
    field: 'tipo_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Tipo (config_tipos_evento)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'eventos_campanhas',
    field: 'tipo_id',
    related_collection: 'config_tipos_evento',
    meta: { one_field: 'eventos' }
  });

  // infratores -> config_niveis_periculosidade
  await ensureField('infratores', {
    field: 'nivel_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Nivel (config_niveis_periculosidade)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'infratores',
    field: 'nivel_id',
    related_collection: 'config_niveis_periculosidade',
    meta: { one_field: 'infratores' }
  });

  // infratores -> config_status_legal
  await ensureField('infratores', {
    field: 'status_legal_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Status legal (config_status_legal)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'infratores',
    field: 'status_legal_id',
    related_collection: 'config_status_legal',
    meta: { one_field: 'infratores' }
  });

  // Junction infratores_tipos_agressao
  await ensureCollection('infratores_tipos_agressao', {
    icon: 'link',
    display_template: '{{infrator_id}}-{{tipo_agressao_id}}',
    sort: 207
  });

  await ensureField('infratores_tipos_agressao', {
    field: 'infrator_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'infratores_tipos_agressao',
    field: 'infrator_id',
    related_collection: 'infratores',
    meta: { one_field: 'tipos_agressao_links' }
  });

  await ensureField('infratores_tipos_agressao', {
    field: 'tipo_agressao_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'infratores_tipos_agressao',
    field: 'tipo_agressao_id',
    related_collection: 'config_tipos_agressao',
    meta: { one_field: 'infratores_links' }
  });

  // Alias M2M em infratores
  await ensureField('infratores', {
    field: 'tipos_agressao_lista',
    type: 'alias',
    meta: {
      interface: 'select-multiple-dropdown-m2m',
      special: ['m2m'],
      note: 'Tipos de agressao (config_tipos_agressao) via tabela de juncao'
    },
    schema: { is_nullable: true }
  });

  await ensureRelation({
    many_collection: 'infratores',
    many_field: 'tipos_agressao_lista',
    one_collection: 'config_tipos_agressao',
    junction_collection: 'infratores_tipos_agressao',
    junction_field: 'infrator_id',
    one_field: 'tipo_agressao_id'
  });
}

async function main() {
  console.log('Refatoracao: substituir enums por tabelas dinamicas (Ser Mulher)');
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log('Aviso: campos antigos de texto permanecem; migre valores para os novos campos _id/_lista conforme necessario.');

  try {
    await etapa1Collections();
    await etapa2Seeds();
    await etapa3Relacionamentos();
    console.log('\n✅ Refatoracao concluida com sucesso.');
  } catch (err) {
    console.error(`\n❌ Erro durante a refatoracao: ${err.message}`);
    process.exit(1);
  }
}

main();
