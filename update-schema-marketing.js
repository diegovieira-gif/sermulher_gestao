import dotenv from 'dotenv';
import { createDirectus, staticToken, rest, createCollection, createField, readCollections } from '@directus/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

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
  console.log('🚀 Criando módulo de Marketing & Clipping...');

  try {
    const collections = await directus.request(readCollections());
    const names = collections.map(c => c.collection);

    // 1. Criar Collection
    if (!names.includes('marketing_items')) {
      await directus.request(createCollection({
        collection: 'marketing_items',
        schema: {},
        meta: { 
          note: 'Registro de postagens, matérias e métricas', 
          icon: 'campaign', 
          display_template: '{{data_publicacao}} - {{titulo}}' 
        }
      }));
      console.log('✅ Collection "marketing_items" criada.');
    } else {
      console.log('⚠️ Collection já existe.');
    }

    // 2. Criar Campos
    await ensureField('marketing_items', 'titulo', { type: 'string', schema: { is_nullable: false }, meta: { note: 'Manchete ou resumo do post' } });
    await ensureField('marketing_items', 'data_publicacao', { type: 'date', schema: { is_nullable: false } });
    
    // Plataforma (Select)
    await ensureField('marketing_items', 'plataforma', {
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Instagram', value: 'instagram', color: '#E1306C' },
            { text: 'Facebook', value: 'facebook', color: '#4267B2' },
            { text: 'LinkedIn', value: 'linkedin', color: '#0077b5' },
            { text: 'Site/Blog', value: 'site', color: '#333333' },
            { text: 'Jornal/Revista', value: 'jornal', color: '#666666' },
            { text: 'TV/Rádio', value: 'midia_tradicional', color: '#ff9900' },
            { text: 'Outros', value: 'outros' }
          ]
        }
      }
    });

    await ensureField('marketing_items', 'link', { type: 'string', meta: { interface: 'url' } });
    
    // Métricas
    await ensureField('marketing_items', 'alcance', { type: 'integer', meta: { note: 'Visualizações, Impressões ou Tiragem' } });
    await ensureField('marketing_items', 'interacoes', { type: 'integer', meta: { note: 'Curtidas, Comentários ou Compartilhamentos' } });
    
    // Organização
    await ensureField('marketing_items', 'campanha', { type: 'string', meta: { note: 'Ex: Outubro Rosa, Institucional, Evento X' } });
    
    // Arquivo de Evidência (Upload)
    await ensureField('marketing_items', 'print_arquivo', { type: 'uuid', meta: { interface: 'file' } });

    console.log('🏁 Módulo de Marketing pronto!');
  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

async function ensureField(collection, field, def) {
  try {
    await directus.request(createField(collection, { field, ...def }));
    console.log(`   ✨ Campo ${field} criado.`);
  } catch (e) { /* Ignora */ }
}

main();
