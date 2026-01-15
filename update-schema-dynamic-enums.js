// Script de migracao de enums fixos para tabelas de configuracao
// Uso: DIRECTUS_URL=... DIRECTUS_ADMIN_TOKEN=... node update-schema-dynamic-enums.js
// Este script cria collections config_* com dados seed e adiciona relacionamentos nas tabelas principais.
// Observacao: o Directus nao troca tipos de campo com dados existentes. A abordagem aqui cria campos novos
// (sufixo _id ou _ids) e registra o relacionamento. Rode em banco limpo ou depois migre dados manualmente.

import { createDirectus, rest, staticToken } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://192.168.0.115:8055';
const ADMIN_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN || 'j8EbY77uaPAhN0ZnGrDvoQI9VUGTvl_7';

const directus = createDirectus(DIRECTUS_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${DIRECTUS_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    let detail = '';
    try {
      const json = await response.json();
      detail = JSON.stringify(json, null, 2);
    } catch (err) {
      detail = response.statusText;
    }
    throw new Error(`HTTP ${response.status} on ${path}: ${detail}`);
  }

  return response.status === 204 ? null : response.json();
}

async function collectionExists(name) {
  try {
    await api(`/collections/${name}`);
    return true;
  } catch (err) {
    return false;
  }
}

async function ensureCollection(collection, meta = {}, schema = {}) {
  const exists = await collectionExists(collection);
  if (exists) {
    console.log(`✓ Collection '${collection}' ja existe`);
    return false;
  }

  await api('/collections', {
    method: 'POST',
    body: { collection, meta, schema }
  });
  console.log(`✓ Collection '${collection}' criada`);
  return true;
}

async function fieldExists(collection, field) {
  try {
    await api(`/fields/${collection}/${field}`);
    return true;
  } catch (err) {
    return false;
  }
}

async function ensureField(collection, fieldConfig) {
  const exists = await fieldExists(collection, fieldConfig.field);
  if (exists) {
    console.log(`  → Campo '${collection}.${fieldConfig.field}' ja existe`);
    return false;
  }

  try {
    await api(`/fields/${collection}`, { method: 'POST', body: fieldConfig });
    console.log(`  ✓ Campo '${collection}.${fieldConfig.field}' criado`);
    return true;
  } catch (err) {
    console.error(`  ✗ Erro ao criar campo '${collection}.${fieldConfig.field}': ${err.message}`);
    return false;
  }
}

async function ensureRelation(payload) {
  try {
    await api('/relations', { method: 'POST', body: payload });
    console.log('  ✓ Relacao criada');
    return true;
  } catch (err) {
    if (err.message.includes('RECORD_NOT_UNIQUE')) {
      console.log('  → Relacao ja existe');
      return false;
    }
    console.error(`  ✗ Erro ao criar relacao: ${err.message}`);
    return false;
  }
}

async function findByName(collection, nome) {
  try {
    const result = await api(`/items/${collection}?filter[nome][_eq]=${encodeURIComponent(nome)}&limit=1`);
    return result?.data?.[0] || null;
  } catch (err) {
    return null;
  }
}

async function ensureSeed(collection, items) {
  for (const item of items) {
    const existing = await findByName(collection, item.nome);
    if (existing) {
      console.log(`  → Seed ignorado em '${collection}': ${item.nome}`);
      continue;
    }

    try {
      await api(`/items/${collection}`, { method: 'POST', body: item });
      console.log(`  ✓ Seed criado em '${collection}': ${item.nome}`);
    } catch (err) {
      console.error(`  ✗ Erro ao seedar '${collection}' (${item.nome}): ${err.message}`);
    }
  }
}

const configCollections = [
  {
    name: 'config_origens',
    meta: { icon: 'list', sort: 101, display_template: '{{nome}}' },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'ativo', type: 'boolean', meta: { interface: 'boolean' }, schema: { default: true, is_nullable: true } }
    ],
    seed: [
      { nome: 'Recepção', ativo: true },
      { nome: 'Ouvidoria', ativo: true },
      { nome: 'Busca Ativa', ativo: true }
    ]
  },
  {
    name: 'config_prioridades',
    meta: { icon: 'flag', sort: 102, display_template: '{{nome}}' },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'cor', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: true } },
      { field: 'nivel', type: 'integer', meta: { interface: 'input' }, schema: { is_nullable: true } }
    ],
    seed: [
      { nome: 'Normal', cor: '#9CA3AF', nivel: 1 },
      { nome: 'Urgente', cor: '#F59E0B', nivel: 2 },
      { nome: 'Emergência', cor: '#EF4444', nivel: 3 }
    ]
  },
  {
    name: 'config_tipos_evento',
    meta: { icon: 'event', sort: 103, display_template: '{{nome}}' },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'icone', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: true } }
    ],
    seed: [
      { nome: 'Campanha', icone: 'campaign' },
      { nome: 'Curso', icone: 'school' },
      { nome: 'Palestra', icone: 'record_voice_over' }
    ]
  },
  {
    name: 'config_tipos_agressao',
    meta: { icon: 'report', sort: 104, display_template: '{{nome}}' },
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
  },
  {
    name: 'config_niveis_periculosidade',
    meta: { icon: 'warning', sort: 105, display_template: '{{nome}}' },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } },
      { field: 'cor', type: 'string', meta: { interface: 'input' }, schema: { is_nullable: true } },
      { field: 'peso', type: 'integer', meta: { interface: 'input' }, schema: { is_nullable: true } }
    ],
    seed: [
      { nome: 'Baixo', cor: '#10B981', peso: 1 },
      { nome: 'Médio', cor: '#F59E0B', peso: 2 },
      { nome: 'Alto', cor: '#EF4444', peso: 3 },
      { nome: 'Crítico', cor: '#7F1D1D', peso: 4 }
    ]
  },
  {
    name: 'config_status_legal',
    meta: { icon: 'gavel', sort: 106, display_template: '{{nome}}' },
    fields: [
      { field: 'nome', type: 'string', meta: { interface: 'input', required: true }, schema: { is_nullable: false } }
    ],
    seed: [
      { nome: 'Em cumprimento' },
      { nome: 'Concluído' },
      { nome: 'Reincidente' }
    ]
  }
];

async function createConfigCollections() {
  console.log('\n=== Criando collections de configuracao ===');
  for (const cfg of configCollections) {
    await ensureCollection(cfg.name, cfg.meta, cfg.schema || {});
    for (const field of cfg.fields) {
      await ensureField(cfg.name, field);
    }
    await ensureSeed(cfg.name, cfg.seed);
  }
}

async function migrateAtendimentos() {
  console.log('\n=== Atualizando atendimentos (origem, prioridade) ===');
  await ensureField('atendimentos', {
    field: 'origem_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Nova origem (config_origens)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'atendimentos',
    field: 'origem_id',
    related_collection: 'config_origens',
    meta: { one_field: 'atendimentos' }
  });

  await ensureField('atendimentos', {
    field: 'prioridade_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Nova prioridade (config_prioridades)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'atendimentos',
    field: 'prioridade_id',
    related_collection: 'config_prioridades',
    meta: { one_field: 'atendimentos' }
  });
}

async function migrateEventos() {
  console.log('\n=== Atualizando eventos_campanhas (tipo) ===');
  await ensureField('eventos_campanhas', {
    field: 'tipo_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Novo tipo (config_tipos_evento)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'eventos_campanhas',
    field: 'tipo_id',
    related_collection: 'config_tipos_evento',
    meta: { one_field: 'eventos' }
  });
}

async function migrateInfratores() {
  console.log('\n=== Atualizando infratores (periculosidade, status, tipos de agressao) ===');

  await ensureField('infratores', {
    field: 'nivel_periculosidade_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Novo nivel (config_niveis_periculosidade)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'infratores',
    field: 'nivel_periculosidade_id',
    related_collection: 'config_niveis_periculosidade',
    meta: { one_field: 'infratores' }
  });

  await ensureField('infratores', {
    field: 'status_legal_id',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'], note: 'Novo status (config_status_legal)' },
    schema: { is_nullable: true }
  });
  await ensureRelation({
    collection: 'infratores',
    field: 'status_legal_id',
    related_collection: 'config_status_legal',
    meta: { one_field: 'infratores' }
  });

  await ensureCollection('infratores_tipos_agressao', {
    icon: 'link',
    sort: 220,
    display_template: '{{infrator_id}}-{{tipo_agressao_id}}'
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

  await ensureField('infratores', {
    field: 'tipo_agressao_ids',
    type: 'alias',
    meta: {
      interface: 'select-multiple-dropdown-m2m',
      special: ['m2m'],
      note: 'Novo relacionamento M2M com config_tipos_agressao'
    },
    schema: { is_nullable: true }
  });

  await ensureRelation({
    many_collection: 'infratores',
    many_field: 'tipo_agressao_ids',
    one_collection: 'config_tipos_agressao',
    junction_collection: 'infratores_tipos_agressao',
    junction_field: 'infrator_id',
    one_field: 'tipo_agressao_id'
  });
}

async function main() {
  console.log('Migração de enums fixos para tabelas dinamicas');
  console.log(`URL: ${DIRECTUS_URL}`);
  console.log('Aviso: execute em banco limpo ou faça a migração de dados para os novos campos (_id/_ids). Campos antigos permanecem intocados.');

  try {
    await createConfigCollections();
    await migrateAtendimentos();
    await migrateEventos();
    await migrateInfratores();

    console.log('\nResumo:');
    console.log('  - Collections config_* criadas e seed populado.');
    console.log('  - Novos campos relacionais adicionados em atendimentos, eventos_campanhas e infratores.');
    console.log('  - Tabela de junção infratores_tipos_agressao criada.');
    console.log('\nPróximos passos sugeridos:');
    console.log('  1) Migrar valores antigos para os novos campos (_id/_ids).');
    console.log('  2) Atualizar a UI para usar os relacionamentos.');
    console.log('  3) Remover os campos antigos se não forem mais usados.');
  } catch (err) {
    console.error(`\nErro durante a migração: ${err.message}`);
    process.exit(1);
  }
}

main();
