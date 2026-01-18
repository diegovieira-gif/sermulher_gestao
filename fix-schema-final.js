/**
 * Script de Correção Final do Schema Directus
 * 
 * Este script:
 * 1. Cria a collection config_encaminhamentos com os campos necessários
 * 2. Remove a collection config_tipos_violencia (se existir) - usamos config_tipos_agressao
 * 
 * Uso: node fix-schema-final.js
 */

import { createDirectus, rest, authentication, readCollections, createCollection, createField, deleteCollection } from '@directus/sdk';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Carregar variáveis de ambiente do .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '.env.local') });

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('   Certifique-se de que DIRECTUS_URL e DIRECTUS_TOKEN estão no .env.local');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL)
  .with(authentication('static', { token: DIRECTUS_TOKEN }))
  .with(rest());

async function main() {
  console.log('🚀 Iniciando correção do schema...\n');

  try {
    // 1. Criar config_encaminhamentos
    console.log('📦 Criando collection config_encaminhamentos...');
    
    try {
      // Criar a collection básica primeiro
      await client.request(
        createCollection({
          collection: 'config_encaminhamentos',
          schema: {
            name: 'config_encaminhamentos',
          },
          meta: {
            collection: 'config_encaminhamentos',
            icon: 'arrow_forward',
            note: 'Tipos de Encaminhamentos para RMA',
            display_template: '{{nome}}',
            hidden: false,
            singleton: false,
            translations: null,
            archive_field: null,
            archive_app_filter: true,
            archive_value: null,
            unarchive_value: null,
            sort_field: 'sort',
          }
        })
      );
      
      console.log('   ✓ Collection criada com sucesso');

      // Criar campo 'nome' (string, required)
      console.log('   📝 Criando campo "nome"...');
      await client.request(
        createField('config_encaminhamentos', {
          field: 'nome',
          type: 'string',
          meta: {
            interface: 'input',
            options: null,
            display: 'raw',
            display_options: null,
            readonly: false,
            hidden: false,
            sort: 1,
            width: 'full',
            translations: null,
            note: 'Nome do encaminhamento',
            conditions: null,
            required: true,
            group: null,
            validation: null,
            validation_message: null,
          },
          schema: {
            name: 'nome',
            table: 'config_encaminhamentos',
            data_type: 'varchar',
            default_value: null,
            max_length: 255,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: false,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_table: null,
            foreign_key_column: null,
          }
        })
      );
      console.log('   ✓ Campo "nome" criado');

      // Criar campo 'grupo_rma' (string dropdown)
      console.log('   📝 Criando campo "grupo_rma"...');
      await client.request(
        createField('config_encaminhamentos', {
          field: 'grupo_rma',
          type: 'string',
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
            display: 'labels',
            display_options: {
              choices: [
                { text: 'Assistência Social', value: 'assistencia_social' },
                { text: 'Saúde', value: 'saude' },
                { text: 'Justiça', value: 'justica' },
                { text: 'Educação', value: 'educacao' },
                { text: 'Outros', value: 'outros' }
              ]
            },
            readonly: false,
            hidden: false,
            sort: 2,
            width: 'half',
            translations: null,
            note: 'Grupo RMA para classificação no relatório',
            conditions: null,
            required: false,
            group: null,
            validation: null,
            validation_message: null,
          },
          schema: {
            name: 'grupo_rma',
            table: 'config_encaminhamentos',
            data_type: 'varchar',
            default_value: null,
            max_length: 255,
            numeric_precision: null,
            numeric_scale: null,
            is_nullable: true,
            is_unique: false,
            is_primary_key: false,
            has_auto_increment: false,
            foreign_key_table: null,
            foreign_key_column: null,
          }
        })
      );
      console.log('   ✓ Campo "grupo_rma" criado');

      console.log('   ✅ Collection config_encaminhamentos criada com sucesso!\n');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('   ℹ️  Collection config_encaminhamentos já existe\n');
      } else if (error.errors && error.errors[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        console.log('   ℹ️  Collection config_encaminhamentos já existe\n');
      } else {
        throw error;
      }
    }

    // 2. Remover config_tipos_violencia se existir
    console.log('🗑️  Tentando remover collection config_tipos_violencia (se existir)...');
    
    try {
      await client.request(deleteCollection('config_tipos_violencia'));
      console.log('   ✓ Collection config_tipos_violencia removida\n');
    } catch (error) {
      if (error.message && error.message.includes('does not exist')) {
        console.log('   ℹ️  Collection config_tipos_violencia não existe (OK)\n');
      } else {
        console.error('   ⚠️  Erro ao remover collection:', error.message);
        console.log('   ℹ️  Pode ser necessário remover manualmente no Directus\n');
      }
    }

    console.log('✅ Script concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verifique no Directus se a collection config_encaminhamentos foi criada');
    console.log('   2. Adicione alguns registros de exemplo');
    console.log('   3. Teste no frontend (aba Configurações)');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar script:');
    console.error('   Mensagem:', error.message);
    if (error.errors) {
      console.error('   Detalhes:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
