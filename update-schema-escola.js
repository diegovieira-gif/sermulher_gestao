import dotenv from 'dotenv';
import { createDirectus, staticToken, rest, createCollection, createField, readCollections, createRelation } from '@directus/sdk';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Configuração de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega o .env.local explicitamente
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// 2. Mapeamento correto das Variáveis (CORRIGIDO)
// O script agora busca os nomes exatos que estão no seu .env.local
const API_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_API_URL;
const ADMIN_TOKEN = process.env.DIRECTUS_TOKEN;

console.log('--- DIAGNÓSTICO DE AMBIENTE ---');
console.log(`🔗 API URL: ${API_URL || '❌ INDEFINIDA'}`);
console.log(`🔑 Token: ${ADMIN_TOKEN ? '✅ Carregado' : '❌ INDEFINIDO'}`);
console.log('-------------------------------');

if (!API_URL || !ADMIN_TOKEN) {
  console.error('⛔ Erro Fatal: Variáveis de ambiente incorretas ou ausentes.');
  process.exit(1);
}

// 3. Inicialização do Cliente
const directus = createDirectus(API_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest());

async function main() {
  console.log('🚀 Iniciando setup do Schema "Escola da Mulher"...');

  try {
    const existingCollections = await directus.request(readCollections());
    const collectionNames = existingCollections.map(c => c.collection);

    // --- COLLECTION: ESCOLA_CURSOS ---
    await ensureCollection(collectionNames, 'escola_cursos', { 
      note: 'Catálogo de Cursos', 
      icon: 'book', 
      display_template: '{{nome}}' 
    });
    
    await ensureField('escola_cursos', 'nome', { type: 'string', schema: { is_nullable: false } });
    await ensureField('escola_cursos', 'area_atuacao', {
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Beleza & Estética', value: 'beleza' },
            { text: 'Gastronomia', value: 'gastronomia' },
            { text: 'Artesanato', value: 'artesanato' },
            { text: 'Tecnologia', value: 'tecnologia' },
            { text: 'Gestão & Negócios', value: 'gestao' },
            { text: 'Outros', value: 'outros' }
          ]
        }
      }
    });
    await ensureField('escola_cursos', 'carga_horaria', { type: 'integer' });
    await ensureField('escola_cursos', 'ementa', { type: 'text', meta: { interface: 'input-multiline' } });

    // --- COLLECTION: ESCOLA_TURMAS ---
    await ensureCollection(collectionNames, 'escola_turmas', { 
      note: 'Oferta de Turmas', 
      icon: 'school', 
      display_template: '{{nome}}' 
    });

    await ensureField('escola_turmas', 'nome', { type: 'string', schema: { is_nullable: false } });
    await ensureField('escola_turmas', 'instrutor', { type: 'string' });
    await ensureField('escola_turmas', 'data_inicio', { type: 'date' });
    await ensureField('escola_turmas', 'data_fim', { type: 'date' });
    await ensureField('escola_turmas', 'vagas', { type: 'integer' });
    await ensureField('escola_turmas', 'status', {
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Aberta', value: 'aberta' },
            { text: 'Em Andamento', value: 'em_andamento' },
            { text: 'Concluída', value: 'concluida' },
            { text: 'Cancelada', value: 'cancelada' }
          ]
        }
      }
    });
    await ensureField('escola_turmas', 'curso', { type: 'integer' });
    await ensureRelation('escola_turmas', 'curso', 'escola_cursos');

    // --- COLLECTION: ESCOLA_MATRICULAS ---
    await ensureCollection(collectionNames, 'escola_matriculas', { 
      note: 'Vínculo Aluna-Turma', 
      icon: 'assignment_ind' 
    });

    await ensureField('escola_matriculas', 'data_matricula', { type: 'timestamp', schema: { default_value: 'NOW()' } });
    await ensureField('escola_matriculas', 'status', {
      type: 'string',
      schema: { default_value: 'cursando' },
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Cursando', value: 'cursando' },
            { text: 'Aprovada', value: 'aprovada' },
            { text: 'Reprovada', value: 'reprovada' },
            { text: 'Evadida', value: 'evadida' }
          ]
        }
      }
    });
    await ensureField('escola_matriculas', 'turma', { type: 'integer' });
    await ensureRelation('escola_matriculas', 'turma', 'escola_turmas');
    
    await ensureField('escola_matriculas', 'beneficiaria', { type: 'integer' });
    await ensureRelation('escola_matriculas', 'beneficiaria', 'beneficiarias');

    console.log('🏁 Setup concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

// Helpers
async function ensureCollection(existingNames, name, meta) {
  if (!existingNames.includes(name)) {
    console.log(`📚 Criando collection "${name}"...`);
    await directus.request(createCollection({ collection: name, schema: {}, meta }));
  } else {
    console.log(`✅ Collection "${name}" já existe.`);
  }
}

async function ensureField(collection, field, definition) {
  try {
    await directus.request(createField(collection, { field, ...definition }));
    console.log(`   ✨ Campo ${collection}.${field} criado.`);
  } catch (err) {
    const msg = err.errors?.[0]?.message || '';
    // Ignora erros de campo já existente
    if (msg.includes('already exists') || err.response?.status === 409 || err.response?.status === 422) {
      console.log(`   ⚠️ Campo ${collection}.${field} já existe.`);
    } else {
      console.log(`   ❌ Erro em ${field}: ${msg}`);
    }
  }
}

async function ensureRelation(collection, field, relatedCollection) {
  try {
    await directus.request(createRelation({
      collection, field, related_collection: relatedCollection,
      schema: { on_delete: 'SET NULL' },
      meta: { display_template: '{{nome}}' }
    }));
    console.log(`   🔗 Relação ${collection}.${field} criada.`);
  } catch (err) {
    const msg = err.errors?.[0]?.message || '';
    if (msg.includes('already exists') || err.response?.status === 409 || err.response?.status === 422) {
      console.log(`   ⚠️ Relação ${collection}.${field} já existe.`);
    } else {
      console.log(`   ❌ Erro na relação: ${msg}`);
    }
  }
}

main();