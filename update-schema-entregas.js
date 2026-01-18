// update-schema-entregas.js
// Cria/atualiza a collection `entregas_beneficios` e seus campos/relacionamentos
// Uso: node update-schema-entregas.js

import dotenv from 'dotenv';
import {
  createCollection,
  createDirectus,
  createField,
  createRelation,
  readCollections,
  readFields,
  readRelations,
  rest,
  staticToken,
} from '@directus/sdk';

// Carrega env de .env.local
dotenv.config({ path: '.env.local' });

const DIRECTUS_URL = process.env.DIRECTUS_API_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Erro: defina DIRECTUS_API_URL (ou NEXT_PUBLIC_DIRECTUS_URL) e DIRECTUS_TOKEN em .env.local');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

async function main() {
  console.log('🚀 Iniciando atualização do schema: entregas_beneficios');
  try {
    // 1) Auditoria de dependências
    await assertCollectionExists('config_beneficios');
    const beneficiariaIdType = await getIdType('beneficiarias');
    const beneficioIdType = await getIdType('config_beneficios');

    // 2) Criação da Collection
    await ensureCollection('entregas_beneficios', {
      icon: 'inventory_2',
      note: 'Registro de entregas de benefícios às beneficiárias',
      display_template: '{{beneficio}} - {{data_entrega}}',
      accountability: 'all',
    });

    // Campos padrões da collection
    await ensureField('entregas_beneficios', 'status', {
      type: 'string',
      interface: 'input',
      defaultValue: 'published',
      required: false,
      width: 'half',
      note: 'Status do registro (padrão: published)',
    });

    await ensureField('entregas_beneficios', 'date_created', {
      type: 'timestamp',
      interface: 'datetime',
      required: false,
      note: 'Data de criação do registro',
    });

    await ensureField('entregas_beneficios', 'user_created', {
      type: 'uuid',
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      required: false,
      note: 'Usuário que realizou a entrega',
    });

    // 3) Campos específicos
    await ensureField('entregas_beneficios', 'data_entrega', {
      type: 'date',
      interface: 'date',
      required: true,
      width: 'half',
      note: 'Data da entrega',
    });

    await ensureField('entregas_beneficios', 'quantidade', {
      type: 'integer',
      interface: 'input',
      defaultValue: 1,
      required: true,
      width: 'half',
      note: 'Quantidade entregue (padrão: 1)',
    });

    await ensureField('entregas_beneficios', 'observacao', {
      type: 'text',
      interface: 'input-multiline',
      required: false,
      width: 'full',
      note: 'Observações gerais (opcional)',
    });

    // Campos M2O com tipo de ID dinâmico
    await ensureField('entregas_beneficios', 'beneficiaria', {
      type: beneficiariaIdType,
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      required: false, // permite SET NULL no on_delete
      note: 'Beneficiária que recebeu o benefício',
    });

    await ensureField('entregas_beneficios', 'beneficio', {
      type: beneficioIdType,
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      required: false, // permite SET NULL no on_delete
      note: 'Tipo de benefício entregue',
    });

    // 4) Relacionamentos cruciais
    await ensureRelation({
      collection: 'entregas_beneficios',
      field: 'beneficiaria',
      related_collection: 'beneficiarias',
      schema: { on_delete: 'SET NULL' },
    });

    await ensureRelation({
      collection: 'entregas_beneficios',
      field: 'beneficio',
      related_collection: 'config_beneficios',
      schema: { on_delete: 'SET NULL' },
    });

    await ensureRelation({
      collection: 'entregas_beneficios',
      field: 'user_created',
      related_collection: 'directus_users',
      schema: { on_delete: 'SET NULL' },
    });

    console.log('✅ Atualização do schema de entregas concluída com sucesso.');
  } catch (error) {
    console.error('❌ Falha ao atualizar schema:', error?.message || error);
    process.exit(1);
  }
}

// Helpers
async function assertCollectionExists(name) {
  const res = await client.request(
    readCollections({ filter: { collection: { _eq: name } } })
  );
  const exists = Array.isArray(res) && res.some((c) => c.collection === name);
  if (!exists) {
    throw new Error(`Collection de dependência ausente: ${name}`);
  }
}

async function getIdType(collection) {
  const fields = await client.request(
    readFields(collection, { filter: { field: { _eq: 'id' } } })
  );
  const idField = Array.isArray(fields) ? fields.find((f) => f.field === 'id') : null;
  const type = idField?.type || 'integer';
  console.log(`🔎 ID type de [${collection}] = ${type}`);
  return type;
}

async function ensureCollection(name, meta = {}) {
  const collections = await client.request(
    readCollections({ filter: { collection: { _eq: name } } })
  );
  const exists = Array.isArray(collections) && collections.some((c) => c.collection === name);
  if (exists) {
    console.log(`ℹ️  Collection ${name} já existe`);
    return;
  }
  await client.request(
    createCollection({
      collection: name,
      meta: { singleton: false, ...meta },
      schema: {},
    })
  );
  console.log(`✨ Collection ${name} criada.`);
}

async function ensureField(collection, field, config) {
  const fields = await client.request(
    readFields(collection, { filter: { field: { _eq: field } } })
  );
  const exists = Array.isArray(fields) && fields.some((f) => f.field === field);
  if (exists) {
    console.log(`ℹ️  Campo ${collection}.${field} já existe`);
    return;
  }
  await client.request(
    createField(collection, {
      field,
      type: config.type,
      meta: {
        interface: config.interface,
        special: config.special,
        required: config.required,
        options: config.options,
        width: config.width || 'full',
        note: config.note,
      },
      schema: {
        default_value: config.defaultValue,
        is_nullable: config.required ? false : true,
      },
    })
  );
  console.log(`➕ Campo ${collection}.${field} criado`);
}

async function ensureRelation(payload) {
  const relations = await client.request(
    readRelations({
      filter: {
        collection: { _eq: payload.collection },
        field: { _eq: payload.field },
      },
    })
  );
  const exists = Array.isArray(relations) && relations.some(
    (rel) => rel.collection === payload.collection && rel.field === payload.field
  );
  if (exists) {
    console.log(`ℹ️  Relação ${payload.collection}.${payload.field} já existe`);
    return;
  }
  await client.request(
    createRelation({
      collection: payload.collection,
      field: payload.field,
      related_collection: payload.related_collection,
      schema: payload.schema || { on_delete: 'SET NULL' },
      meta: payload.meta,
    })
  );
  console.log(`🔗 Relação criada para ${payload.collection}.${payload.field}`);
}

main();
