/**
 * Script para criar campos e relações faltantes na collection atendimentos
 * 
 * Campos a criar:
 * 1. encaminhamento_id (M2O) -> config_encaminhamentos
 * 2. tipos_violencia_lista (M2M) -> config_tipos_agressao (via junction table)
 * 
 * Uso: node update-atendimentos-relations.js
 */

import { createDirectus, rest, staticToken, createField, createRelation, createCollection } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ ERRO: Variáveis NEXT_PUBLIC_DIRECTUS_URL e DIRECTUS_TOKEN são obrigatórias!');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

/**
 * Cria o campo encaminhamento_id (M2O)
 */
async function createEncaminhamentoField() {
  console.log('\n📝 Criando campo encaminhamento_id (M2O)...');
  
  try {
    // Cria o campo encaminhamento_id
    await client.request(
      createField('atendimentos', {
        field: 'encaminhamento_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          options: {
            template: '{{nome}}',
          },
          display: 'related-values',
          display_options: {
            template: '{{nome}}',
          },
          special: ['m2o'],
          required: false,
        },
        schema: {
          is_nullable: true,
        },
      })
    );
    console.log('✅ Campo encaminhamento_id criado');

    // Cria a relação M2O
    await client.request(
      createRelation({
        collection: 'atendimentos',
        field: 'encaminhamento_id',
        related_collection: 'config_encaminhamentos',
        meta: {
          many_collection: 'atendimentos',
          many_field: 'encaminhamento_id',
          one_collection: 'config_encaminhamentos',
          one_field: null,
          one_allowed_collections: null,
          junction_field: null,
          sort_field: null,
        },
        schema: {
          on_delete: 'SET NULL',
        },
      })
    );
    console.log('✅ Relação M2O criada: atendimentos -> config_encaminhamentos');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Campo encaminhamento_id já existe, pulando...');
    } else {
      console.error('❌ Erro ao criar campo encaminhamento_id:', error);
      throw error;
    }
  }
}

/**
 * Cria a junction table e relações M2M para tipos_violencia_lista
 */
async function createTiposViolenciaM2M() {
  console.log('\n📝 Criando relação M2M tipos_violencia_lista...');

  const junctionCollection = 'atendimentos_config_tipos_agressao';

  try {
    // 1. Criar a collection de junção
    console.log(`   Criando junction collection: ${junctionCollection}...`);
    await client.request(
      createCollection({
        collection: junctionCollection,
        meta: {
          hidden: true,
          icon: 'import_export',
        },
        schema: {
          name: junctionCollection,
        },
      })
    );
    console.log('✅ Junction collection criada');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Junction collection já existe, continuando...');
    } else {
      console.error('❌ Erro ao criar junction collection:', error);
      throw error;
    }
  }

  try {
    // 2. Criar campo atendimentos_id na junction
    console.log('   Criando campo atendimentos_id na junction...');
    await client.request(
      createField(junctionCollection, {
        field: 'atendimentos_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          required: false,
        },
        schema: {
          is_nullable: true,
        },
      })
    );
    console.log('✅ Campo atendimentos_id criado');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Campo atendimentos_id já existe');
    } else {
      console.error('❌ Erro ao criar campo atendimentos_id:', error);
      throw error;
    }
  }

  try {
    // 3. Criar campo config_tipos_agressao_id na junction
    console.log('   Criando campo config_tipos_agressao_id na junction...');
    await client.request(
      createField(junctionCollection, {
        field: 'config_tipos_agressao_id',
        type: 'integer',
        meta: {
          interface: 'select-dropdown-m2o',
          special: ['m2o'],
          required: false,
        },
        schema: {
          is_nullable: true,
        },
      })
    );
    console.log('✅ Campo config_tipos_agressao_id criado');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Campo config_tipos_agressao_id já existe');
    } else {
      console.error('❌ Erro ao criar campo config_tipos_agressao_id:', error);
      throw error;
    }
  }

  try {
    // 4. Criar campo alias tipos_violencia_lista em atendimentos
    console.log('   Criando campo alias tipos_violencia_lista em atendimentos...');
    await client.request(
      createField('atendimentos', {
        field: 'tipos_violencia_lista',
        type: 'alias',
        meta: {
          interface: 'list-m2m',
          special: ['m2m'],
          options: {
            template: '{{config_tipos_agressao_id.nome}}',
          },
          display: 'related-values',
          display_options: {
            template: '{{config_tipos_agressao_id.nome}}',
          },
        },
      })
    );
    console.log('✅ Campo alias tipos_violencia_lista criado');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Campo tipos_violencia_lista já existe');
    } else {
      console.error('❌ Erro ao criar campo alias tipos_violencia_lista:', error);
      throw error;
    }
  }

  try {
    // 5. Criar relação atendimentos -> junction
    console.log('   Criando relação atendimentos -> junction...');
    await client.request(
      createRelation({
        collection: junctionCollection,
        field: 'atendimentos_id',
        related_collection: 'atendimentos',
        meta: {
          many_collection: junctionCollection,
          many_field: 'atendimentos_id',
          one_collection: 'atendimentos',
          one_field: 'tipos_violencia_lista',
          one_allowed_collections: null,
          junction_field: 'config_tipos_agressao_id',
          sort_field: null,
        },
        schema: {
          on_delete: 'CASCADE',
        },
      })
    );
    console.log('✅ Relação atendimentos -> junction criada');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Relação atendimentos -> junction já existe');
    } else {
      console.error('❌ Erro ao criar relação atendimentos -> junction:', error);
      throw error;
    }
  }

  try {
    // 6. Criar relação junction -> config_tipos_agressao
    console.log('   Criando relação junction -> config_tipos_agressao...');
    await client.request(
      createRelation({
        collection: junctionCollection,
        field: 'config_tipos_agressao_id',
        related_collection: 'config_tipos_agressao',
        meta: {
          many_collection: junctionCollection,
          many_field: 'config_tipos_agressao_id',
          one_collection: 'config_tipos_agressao',
          one_field: null,
          one_allowed_collections: null,
          junction_field: 'atendimentos_id',
          sort_field: null,
        },
        schema: {
          on_delete: 'CASCADE',
        },
      })
    );
    console.log('✅ Relação junction -> config_tipos_agressao criada');
  } catch (error) {
    if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      console.log('⚠️  Relação junction -> config_tipos_agressao já existe');
    } else {
      console.error('❌ Erro ao criar relação junction -> config_tipos_agressao:', error);
      throw error;
    }
  }

  console.log('✅ Relação M2M tipos_violencia_lista configurada com sucesso!');
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando atualização do schema de atendimentos...');
  console.log(`📍 Directus URL: ${DIRECTUS_URL}`);

  try {
    // Criar campo encaminhamento_id (M2O)
    await createEncaminhamentoField();

    // Criar relação M2M tipos_violencia_lista
    await createTiposViolenciaM2M();

    console.log('\n✨ Schema de atendimentos atualizado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Verificar os campos no Directus Admin');
    console.log('   2. Testar a criação/edição de atendimentos');
    console.log('   3. Verificar se a listagem está funcionando');
  } catch (error) {
    console.error('\n❌ Erro durante a atualização:', error);
    process.exit(1);
  }
}

// Executa o script
main();
