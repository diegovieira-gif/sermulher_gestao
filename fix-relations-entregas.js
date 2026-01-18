// fix-relations-entregas.js
// Corrige relacionamentos orfãos na collection entregas_beneficios
// Uso: node fix-relations-entregas.js

import dotenv from 'dotenv';
import {
  createDirectus,
  staticToken,
  rest,
  readRelations,
  createRelation,
  deleteRelation,
} from '@directus/sdk';

dotenv.config({ path: '.env.local' });

const DIRECTUS_URL = process.env.DIRECTUS_API_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Erro: defina DIRECTUS_API_URL (ou NEXT_PUBLIC_DIRECTUS_URL) e DIRECTUS_TOKEN em .env.local');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

// Mapeamento de relações esperadas
const EXPECTED_RELATIONS = [
  {
    collection: 'entregas_beneficios',
    field: 'beneficiaria',
    relatedCollection: 'beneficiarias',
    schema: { on_delete: 'SET NULL' },
    meta: { display_template: '{{nome_completo}}' },
  },
  {
    collection: 'entregas_beneficios',
    field: 'beneficio',
    relatedCollection: 'config_beneficios',
    schema: { on_delete: 'SET NULL' },
    meta: { display_template: '{{nome}}', interface: 'select-dropdown-m2o' },
  },
  {
    collection: 'entregas_beneficios',
    field: 'user_created',
    relatedCollection: 'directus_users',
    schema: { on_delete: 'SET NULL' },
    meta: { display_template: '{{first_name}} {{last_name}}' },
  },
];

async function main() {
  console.log('🚀 Iniciando correção de relacionamentos: entregas_beneficios\n');

  try {
    const relations = await client.request(
      readRelations({ 
        filter: { collection: { _eq: 'entregas_beneficios' } } 
      })
    );

    console.log(`📋 Relacionamentos atuais encontrados: ${relations.length}`);
    relations.forEach((rel) => {
      console.log(`   - ${rel.collection}.${rel.field} → ${rel.related_collection}`);
    });
    console.log('');

    // Processa cada relação esperada
    for (const expectedRel of EXPECTED_RELATIONS) {
      await fixRelation(expectedRel, relations);
    }

    console.log('\n✅ Correção de relacionamentos concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao corrigir relacionamentos:', error?.message || error);
    process.exit(1);
  }
}

async function fixRelation(expectedRel, existingRelations) {
  const relKey = `${expectedRel.collection}.${expectedRel.field}`;
  const exists = existingRelations.some(
    (rel) => rel.collection === expectedRel.collection && rel.field === expectedRel.field
  );

  if (exists) {
    const current = existingRelations.find(
      (rel) => rel.collection === expectedRel.collection && rel.field === expectedRel.field
    );

    // Verifica se o related_collection está correto
    if (current.related_collection !== expectedRel.relatedCollection) {
      console.log(`⚠️  Relação ${relKey} aponta para ${current.related_collection} (esperado: ${expectedRel.relatedCollection})`);
      console.log(`   🔧 Deletando relação orfã...`);
      try {
        await client.request(deleteRelation(expectedRel.collection, expectedRel.field));
        console.log(`   ✓ Relação deletada. Recriando...`);
        await createRelationWithMeta(expectedRel);
      } catch (error) {
        console.error(`   ❌ Erro ao deletar/recriar: ${error?.message}`);
      }
    } else {
      console.log(`✓ Relação ${relKey} já está correta (→ ${expectedRel.relatedCollection})`);
    }
  } else {
    console.log(`🔗 Criando relação ausente: ${relKey}`);
    try {
      await createRelationWithMeta(expectedRel);
    } catch (error) {
      console.error(`   ❌ Erro ao criar: ${error?.message}`);
    }
  }
}

async function createRelationWithMeta(rel) {
  await client.request(
    createRelation({
      collection: rel.collection,
      field: rel.field,
      related_collection: rel.relatedCollection,
      schema: rel.schema,
      meta: rel.meta,
    })
  );
  console.log(`   ✅ Relação criada: ${rel.collection}.${rel.field} → ${rel.relatedCollection}`);
}

main();
