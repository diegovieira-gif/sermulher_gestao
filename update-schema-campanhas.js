import dotenv from 'dotenv';
import { createDirectus, staticToken, rest, createCollection, createField, readCollections, createRelation } from '@directus/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_API_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_TOKEN;

if (!API_URL || !ADMIN_TOKEN) {
  console.error('⛔ Variáveis de ambiente ausentes.');
  process.exit(1);
}

const directus = createDirectus(API_URL).with(staticToken(ADMIN_TOKEN)).with(rest());

async function main() {
  console.log('🚀 Iniciando atualização de Schema (Campanhas)...');

  try {
    const collections = await directus.request(readCollections());
    const names = collections.map(c => c.collection);

    // 1. Criar Tabela de Configuração de Campanhas
    if (!names.includes('config_campanhas')) {
      await directus.request(createCollection({
        collection: 'config_campanhas',
        schema: {},
        meta: { 
          note: 'Campanhas Temáticas (Outubro Rosa, etc)', 
          icon: 'flag', 
          display_template: '{{nome}}' 
        }
      }));
      console.log('✅ Collection "config_campanhas" criada.');
      
      // Campos
      await ensureField('config_campanhas', 'nome', { type: 'string', schema: { is_nullable: false } });
      await ensureField('config_campanhas', 'mes', { type: 'string', meta: { note: 'Ex: Outubro' } });
      await ensureField('config_campanhas', 'cor', { type: 'string', meta: { interface: 'select-color' } });
      await ensureField('config_campanhas', 'status', { 
        type: 'string', 
        schema: { default_value: 'ativo' },
        meta: { 
          interface: 'select-dropdown', 
          options: { choices: [{ text: 'Ativo', value: 'ativo' }, { text: 'Inativo', value: 'inativo' }] } 
        } 
      });
    }

    // 2. Atualizar Tabela de Marketing (Adicionar Relação)
    // Vamos criar um campo 'campanha_id' que é um link para config_campanhas
    try {
      await directus.request(createField('marketing_items', {
        field: 'campanha_id',
        type: 'integer',
        meta: { interface: 'select-dropdown-m2o', display: 'related-values', display_options: { template: '{{nome}}' } }
      }));
      
      await directus.request(createRelation({
        collection: 'marketing_items',
        field: 'campanha_id',
        related_collection: 'config_campanhas',
        schema: { on_delete: 'SET NULL' }
      }));
      console.log('✅ Relacionamento Marketing -> Campanha criado.');
    } catch (e) {
      console.log('ℹ️ Campo campanha_id já deve existir.');
    }

    console.log('🏁 Schema atualizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

async function ensureField(collection, field, def) {
  try {
    await directus.request(createField(collection, { field, ...def }));
  } catch (e) { /* Ignora */ }
}

main();
