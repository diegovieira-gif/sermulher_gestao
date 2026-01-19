import dotenv from 'dotenv';
import { createDirectus, staticToken, rest, createCollection, createField, readCollections, createRelation } from '@directus/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração de Ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_API_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_TOKEN;

if (!API_URL || !ADMIN_TOKEN) {
  console.error('⛔ Erro: Variáveis de ambiente (URL/TOKEN) não encontradas.');
  process.exit(1);
}

const directus = createDirectus(API_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function main() {
  console.log('🚀 Criando tabela de Frequência...');

  try {
    const collections = await directus.request(readCollections());
    const names = collections.map(c => c.collection);

    // 1. Criar Collection `escola_frequencia`
    if (!names.includes('escola_frequencia')) {
      await directus.request(createCollection({
        collection: 'escola_frequencia',
        schema: {},
        meta: { note: 'Diário de Classe', icon: 'event_available', display_template: '{{data}}' }
      }));
      console.log('✅ Collection criada.');
    } else {
      console.log('⚠️ Collection já existe.');
    }

    // 2. Criar Campos
    // Data da aula
    await ensureField('escola_frequencia', 'data', { type: 'date', schema: { is_nullable: false } });
    
    // Presente? (Sim/Não)
    await ensureField('escola_frequencia', 'presente', { type: 'boolean', schema: { default_value: true } });

    // Relacionamentos
    // Link com a Turma
    await ensureField('escola_frequencia', 'turma', { type: 'integer' });
    await ensureRelation('escola_frequencia', 'turma', 'escola_turmas');

    // Link com a Beneficiária (Quem é a aluna?)
    await ensureField('escola_frequencia', 'beneficiaria', { type: 'integer' });
    await ensureRelation('escola_frequencia', 'beneficiaria', 'beneficiarias');

    console.log('🏁 Tabela de frequência pronta!');
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

async function ensureField(collection, field, def) {
  try {
    await directus.request(createField(collection, { field, ...def }));
    console.log(`   ✨ Campo ${field} criado.`);
  } catch (e) { /* Ignora se já existe */ }
}

async function ensureRelation(collection, field, related) {
  try {
    await directus.request(createRelation({
      collection, field, related_collection: related,
      schema: { on_delete: 'CASCADE' } // Se apagar a aluna/turma, apaga a presença
    }));
    console.log(`   🔗 Relação ${field} -> ${related} criada.`);
  } catch (e) { /* Ignora */ }
}

main();
