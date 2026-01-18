// fix-schema-configs.js
// Script robusto para corrigir redundância de tabelas e criar collection de encaminhamentos

import { 
  createDirectus, 
  staticToken, 
  rest, 
  readCollections, 
  createCollection, 
  createField, 
  readFields,
  deleteCollection,
  updateField
} from '@directus/sdk';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: '.env.local' });

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Erro: Variáveis de ambiente DIRECTUS_URL ou DIRECTUS_TOKEN não encontradas.');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL)
  .with(staticToken(DIRECTUS_TOKEN))
  .with(rest());

// Função utilitária de delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Iniciando correção do schema...\n');

  try {
    // --- 1. LIMPAR REDUNDÂNCIA ---
    console.log('🗑️  Etapa 1: Removendo redundância (config_tipos_violencia)...');
    await cleanDuplicidade();
    
    await delay(1000); // Aguardar antes da próxima operação

    // --- 2. CRIAR ENCAMINHAMENTOS ---
    console.log('\n📍 Etapa 2: Criando/verificando collection [config_encaminhamentos]...');
    await createEncaminhamentos();

    console.log('\n✅ Correção do schema concluída com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    console.error('   Detalhes:', error.response?.data || error.message);
    process.exit(1);
  }
}

// --- FUNÇÕES PRINCIPAIS ---

/**
 * Remove a collection config_tipos_violencia se existir
 */
async function cleanDuplicidade() {
  try {
    console.log('   → Consultando collections existentes...');
    const collections = await client.request(readCollections());
    const tiposViolenciaExists = collections.some((col) => col.collection === 'config_tipos_violencia');

    if (tiposViolenciaExists) {
      console.log('   → Encontrada config_tipos_violencia. Deletando...');
      await client.request(deleteCollection('config_tipos_violencia'));
      console.log('   ✅ config_tipos_violencia deletada com sucesso');
    } else {
      console.log('   ℹ️  config_tipos_violencia não existe (já estava limpo)');
    }
  } catch (error) {
    if (error.response?.status === 404 || error.message?.includes('not found')) {
      console.log('   ℹ️  config_tipos_violencia não encontrada (OK)');
    } else {
      throw error;
    }
  }
}

/**
 * Cria/verifica a collection config_encaminhamentos com seus campos
 */
async function createEncaminhamentos() {
  try {
    console.log('   → Consultando collections existentes...');
    const collections = await client.request(readCollections());
    const encaminhamentosExists = collections.some((col) => col.collection === 'config_encaminhamentos');

    if (encaminhamentosExists) {
      console.log('   ℹ️  config_encaminhamentos já existe. Verificando campos...');
      await ensureFieldExists('config_encaminhamentos', 'nome');
      await ensureFieldExists('config_encaminhamentos', 'grupo_rma');
    } else {
      console.log('   → Criando collection config_encaminhamentos...');
      
      // Criar a collection com meta mínimo
      await client.request(
        createCollection({
          collection: 'config_encaminhamentos',
          schema: {},
          meta: {
            note: 'Locais de encaminhamento (CRAS, CREAS, Hospital, etc)'
          }
        })
      );
      
      console.log('   ✅ Collection criada');
      
      // Aguardar um pouco para a collection ser registrada
      await delay(500);
      
      // Criar campo: nome
      console.log('   → Criando campo "nome"...');
      await client.request(
        createField('config_encaminhamentos', {
          field: 'nome',
          type: 'string',
          schema: {
            is_nullable: false
          },
          meta: {
            interface: 'input',
            options: {},
            note: 'Nome do local de encaminhamento',
            width: 'full',
            required: true
          }
        })
      );
      console.log('   ✅ Campo "nome" criado');
      
      // Aguardar antes do próximo campo
      await delay(500);
      
      // Criar campo: grupo_rma
      console.log('   → Criando campo "grupo_rma"...');
      await client.request(
        createField('config_encaminhamentos', {
          field: 'grupo_rma',
          type: 'string',
          schema: {
            is_nullable: false
          },
          meta: {
            interface: 'select-dropdown',
            options: {
              choices: [
                { text: 'Assistência Social', value: 'assistencia_social' },
                { text: 'Saúde', value: 'saude' },
                { text: 'Justiça', value: 'justica' },
                { text: 'Educação', value: 'educacao' },
                { text: 'Outros', value: 'outros' }
              ]
            },
            note: 'Classificação para relatório RMA',
            width: 'half',
            required: true
          }
        })
      );
      console.log('   ✅ Campo "grupo_rma" criado');
      console.log('   ✅ Collection config_encaminhamentos criada com sucesso');
    }
  } catch (error) {
    if (error.response?.status === 422 || error.message?.includes('already exists')) {
      console.log('   ℹ️  Collection já existe, pulando...');
    } else {
      throw error;
    }
  }
}

/**
 * Verifica e cria um campo se não existir
 */
async function ensureFieldExists(collectionName, fieldName) {
  try {
    const fields = await client.request(readFields(collectionName));
    const fieldExists = fields.some((f) => f.field === fieldName);

    if (!fieldExists) {
      console.log(`   → Campo "${fieldName}" não existe. Criando...`);
      
      if (fieldName === 'nome') {
        await client.request(
          createField(collectionName, {
            field: 'nome',
            type: 'string',
            schema: { is_nullable: false },
            meta: {
              interface: 'input',
              note: 'Nome do local de encaminhamento',
              width: 'full',
              required: true
            }
          })
        );
      } else if (fieldName === 'grupo_rma') {
        await client.request(
          createField(collectionName, {
            field: 'grupo_rma',
            type: 'string',
            schema: { is_nullable: false },
            meta: {
              interface: 'select-dropdown',
              options: {
                choices: [
                  { text: 'Assistência Social', value: 'assistencia_social' },
                  { text: 'Saúde', value: 'saude' },
                  { text: 'Justiça', value: 'justica' },
                  { text: 'Educação', value: 'educacao' },
                  { text: 'Outros', value: 'outros' }
                ]
              },
              note: 'Classificação para relatório RMA',
              width: 'half',
              required: true
            }
          })
        );
      }
      
      console.log(`   ✅ Campo "${fieldName}" criado`);
    } else {
      console.log(`   ℹ️  Campo "${fieldName}" já existe`);
    }
  } catch (error) {
    if (error.response?.status === 422 || error.message?.includes('already exists')) {
      console.log(`   ℹ️  Campo "${fieldName}" já existe`);
    } else {
      console.warn(`   ⚠️  Não foi possível verificar/criar campo "${fieldName}":`, error.message);
    }
  }
}

// Executa a função principal
main();
