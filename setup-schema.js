/**
 * Script de Configuração do Schema do Directus
 * Cria todas as collections, campos e relacionamentos programaticamente
 * 
 * Uso: node setup-schema.js
 */

import { createDirectus, rest, staticToken, createCollection, createField, createRelation } from '@directus/sdk';

// ========================================
// CONFIGURAÇÃO
// ========================================
const DIRECTUS_URL = 'http://192.168.0.115:8055';
const ADMIN_TOKEN = 'j8EbY77uaPAhN0ZnGrDvoQI9VUGTvl_7'; // SUBSTITUA pelo seu token admin

// Cliente Directus
const directus = createDirectus(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest());

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Verifica se uma collection existe
 */
async function collectionExists(collectionName) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/collections/${collectionName}`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Cria uma collection se não existir
 */
async function createCollectionIfNotExists(collectionName, schema) {
  try {
    const exists = await collectionExists(collectionName);
    
    if (exists) {
      console.log(`✓ Collection '${collectionName}' já existe`);
      return { created: false };
    }

    const response = await fetch(`${DIRECTUS_URL}/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        collection: collectionName,
        meta: schema.meta || {},
        schema: schema.schema || {}
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    console.log(`✓ Collection '${collectionName}' criada com sucesso`);
    return { created: true };
  } catch (error) {
    console.error(`✗ Erro ao criar collection '${collectionName}':`, error.message);
    throw error;
  }
}

/**
 * Cria um campo em uma collection
 */
async function createFieldInCollection(collectionName, fieldConfig) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/fields/${collectionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fieldConfig)
    });

    if (!response.ok) {
      const error = await response.json();
      // Se o campo já existe, não é um erro crítico
      if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        console.log(`  → Campo '${fieldConfig.field}' já existe`);
        return { created: false };
      }
      throw new Error(JSON.stringify(error));
    }

    console.log(`  ✓ Campo '${fieldConfig.field}' criado`);
    return { created: true };
  } catch (error) {
    console.error(`  ✗ Erro ao criar campo '${fieldConfig.field}':`, error.message);
    return { created: false, error };
  }
}

/**
 * Cria um relacionamento entre collections
 */
async function createRelationship(relationConfig) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/relations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(relationConfig)
    });

    if (!response.ok) {
      const error = await response.json();
      // Se a relação já existe, não é erro crítico
      if (error.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
        console.log(`  → Relação já existe`);
        return { created: false };
      }
      throw new Error(JSON.stringify(error));
    }

    console.log(`  ✓ Relação criada: ${relationConfig.collection}.${relationConfig.field} -> ${relationConfig.related_collection}`);
    return { created: true };
  } catch (error) {
    console.error(`  ✗ Erro ao criar relação:`, error.message);
    return { created: false, error };
  }
}

// ========================================
// SCHEMAS DAS COLLECTIONS
// ========================================

/**
 * 1. BENEFICIÁRIAS
 */
async function createBeneficiarias() {
  console.log('\n📋 Criando collection: beneficiarias');
  
  await createCollectionIfNotExists('beneficiarias', {
    meta: {
      icon: 'person',
      display_template: '{{nome_completo}}',
      sort: 1
    }
  });

  const fields = [
    {
      field: 'nome_completo',
      type: 'string',
      meta: { required: true, interface: 'input' },
      schema: { is_nullable: false }
    },
    {
      field: 'cpf',
      type: 'string',
      meta: { interface: 'input', note: 'CPF único' },
      schema: { is_unique: true, is_nullable: true }
    },
    {
      field: 'data_nascimento',
      type: 'date',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    },
    {
      field: 'contato',
      type: 'json',
      meta: { interface: 'input-code', options: { language: 'json' } },
      schema: { is_nullable: true }
    },
    {
      field: 'endereco',
      type: 'json',
      meta: { interface: 'input-code', options: { language: 'json' } },
      schema: { is_nullable: true }
    },
    {
      field: 'perfil_socioeconomico',
      type: 'text',
      meta: { interface: 'input-multiline' },
      schema: { is_nullable: true }
    },
    {
      field: 'tags',
      type: 'csv',
      meta: { interface: 'tags' },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('beneficiarias', field);
  }
}

/**
 * 2. LOCAIS
 */
async function createLocais() {
  console.log('\n📋 Criando collection: locais');
  
  await createCollectionIfNotExists('locais', {
    meta: {
      icon: 'place',
      display_template: '{{nome}}',
      sort: 2
    }
  });

  const fields = [
    {
      field: 'nome',
      type: 'string',
      meta: { required: true, interface: 'input' },
      schema: { is_nullable: false }
    },
    {
      field: 'endereco',
      type: 'string',
      meta: { interface: 'input' },
      schema: { is_nullable: true }
    },
    {
      field: 'capacidade',
      type: 'integer',
      meta: { interface: 'input' },
      schema: { is_nullable: true }
    },
    {
      field: 'tipo',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'CRAS', value: 'CRAS' },
            { text: 'Escola', value: 'Escola' },
            { text: 'Centro Comunitário', value: 'Centro Comunitário' },
            { text: 'Auditório', value: 'Auditório' }
          ]
        }
      },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('locais', field);
  }
}

/**
 * 3. SETORES
 */
async function createSetores() {
  console.log('\n📋 Criando collection: setores');
  
  await createCollectionIfNotExists('setores', {
    meta: {
      icon: 'workspaces',
      display_template: '{{nome}}',
      sort: 3
    }
  });

  const fields = [
    {
      field: 'nome',
      type: 'string',
      meta: { 
        required: true, 
        interface: 'input',
        note: 'Ex: Recepção, Jurídico, Psicológico'
      },
      schema: { is_nullable: false }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('setores', field);
  }
}

/**
 * 4. ATENDIMENTOS (Fluxo Macro)
 */
async function createAtendimentos() {
  console.log('\n📋 Criando collection: atendimentos');
  
  await createCollectionIfNotExists('atendimentos', {
    meta: {
      icon: 'assignment',
      display_template: '{{status}} - {{beneficiaria}}',
      sort: 4
    }
  });

  const fields = [
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Aberto', value: 'Aberto' },
            { text: 'Em andamento', value: 'Em andamento' },
            { text: 'Concluído', value: 'Concluído' },
            { text: 'Arquivado', value: 'Arquivado' }
          ]
        }
      },
      schema: { default: 'Aberto', is_nullable: true }
    },
    {
      field: 'origem',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Recepção', value: 'Recepção' },
            { text: 'Ouvidoria', value: 'Ouvidoria' },
            { text: 'Busca Ativa', value: 'Busca Ativa' }
          ]
        }
      },
      schema: { is_nullable: true }
    },
    {
      field: 'prioridade',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Normal', value: 'Normal' },
            { text: 'Urgente', value: 'Urgente' },
            { text: 'Emergência', value: 'Emergência' }
          ]
        }
      },
      schema: { default: 'Normal', is_nullable: true }
    },
    {
      field: 'data_abertura',
      type: 'timestamp',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('atendimentos', field);
  }

  // Relacionamento M2O: atendimentos -> beneficiarias
  console.log('  Criando relacionamento: beneficiaria');
  await createFieldInCollection('atendimentos', {
    field: 'beneficiaria',
    type: 'integer',
    meta: {
      interface: 'select-dropdown-m2o',
      special: ['m2o']
    },
    schema: { is_nullable: true }
  });

  await createRelationship({
    collection: 'atendimentos',
    field: 'beneficiaria',
    related_collection: 'beneficiarias',
    meta: {
      one_field: 'atendimentos'
    }
  });
}

/**
 * 5. TRAMITAÇÕES (Histórico detalhado)
 */
async function createTramitacoes() {
  console.log('\n📋 Criando collection: tramitacoes');
  
  await createCollectionIfNotExists('tramitacoes', {
    meta: {
      icon: 'history',
      display_template: '{{tipo_demanda}} - {{setor_responsavel}}',
      sort: 5
    }
  });

  const fields = [
    {
      field: 'tipo_demanda',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Jurídica', value: 'Jurídica' },
            { text: 'Terapia', value: 'Terapia' },
            { text: 'Medida Protetiva', value: 'Medida Protetiva' },
            { text: 'Exame', value: 'Exame' }
          ]
        }
      },
      schema: { is_nullable: true }
    },
    {
      field: 'relato_tecnico',
      type: 'text',
      meta: { interface: 'input-rich-text-html' },
      schema: { is_nullable: true }
    },
    {
      field: 'status_etapa',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Aguardando', value: 'Aguardando' },
            { text: 'Em atendimento', value: 'Em atendimento' },
            { text: 'Finalizado', value: 'Finalizado' }
          ]
        }
      },
      schema: { default: 'Aguardando', is_nullable: true }
    },
    {
      field: 'data_recebimento',
      type: 'timestamp',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    },
    {
      field: 'data_conclusao',
      type: 'timestamp',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('tramitacoes', field);
  }

  // Relacionamentos M2O
  console.log('  Criando relacionamentos...');
  
  // atendimento_pai
  await createFieldInCollection('tramitacoes', {
    field: 'atendimento_pai',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'tramitacoes',
    field: 'atendimento_pai',
    related_collection: 'atendimentos',
    meta: { one_field: 'tramitacoes' }
  });

  // setor_responsavel
  await createFieldInCollection('tramitacoes', {
    field: 'setor_responsavel',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'tramitacoes',
    field: 'setor_responsavel',
    related_collection: 'setores',
    meta: { one_field: 'tramitacoes' }
  });

  // usuario_responsavel (directus_users)
  await createFieldInCollection('tramitacoes', {
    field: 'usuario_responsavel',
    type: 'uuid',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'tramitacoes',
    field: 'usuario_responsavel',
    related_collection: 'directus_users',
    meta: { one_field: null }
  });
}

/**
 * 6. EVENTOS_CAMPANHAS
 */
async function createEventosCampanhas() {
  console.log('\n📋 Criando collection: eventos_campanhas');
  
  await createCollectionIfNotExists('eventos_campanhas', {
    meta: {
      icon: 'event',
      display_template: '{{nome}} ({{tipo}})',
      sort: 6
    }
  });

  const fields = [
    {
      field: 'nome',
      type: 'string',
      meta: { required: true, interface: 'input' },
      schema: { is_nullable: false }
    },
    {
      field: 'tipo',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Campanha', value: 'Campanha' },
            { text: 'Curso', value: 'Curso' },
            { text: 'Palestra', value: 'Palestra' }
          ]
        }
      },
      schema: { is_nullable: true }
    },
    {
      field: 'data_inicio',
      type: 'date',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    },
    {
      field: 'data_fim',
      type: 'date',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    },
    {
      field: 'descricao',
      type: 'text',
      meta: { interface: 'input-rich-text-html' },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('eventos_campanhas', field);
  }
}

/**
 * 7. TURMAS_SESSOES
 */
async function createTurmasSessoes() {
  console.log('\n📋 Criando collection: turmas_sessoes');
  
  await createCollectionIfNotExists('turmas_sessoes', {
    meta: {
      icon: 'school',
      display_template: '{{nome_identificador}}',
      sort: 7
    }
  });

  const fields = [
    {
      field: 'nome_identificador',
      type: 'string',
      meta: { required: true, interface: 'input' },
      schema: { is_nullable: false }
    },
    {
      field: 'vagas',
      type: 'integer',
      meta: { interface: 'input' },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('turmas_sessoes', field);
  }

  // Relacionamentos M2O
  console.log('  Criando relacionamentos...');
  
  // evento_pai
  await createFieldInCollection('turmas_sessoes', {
    field: 'evento_pai',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'turmas_sessoes',
    field: 'evento_pai',
    related_collection: 'eventos_campanhas',
    meta: { one_field: 'turmas_sessoes' }
  });

  // local
  await createFieldInCollection('turmas_sessoes', {
    field: 'local',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'turmas_sessoes',
    field: 'local',
    related_collection: 'locais',
    meta: { one_field: 'turmas_sessoes' }
  });
}

/**
 * 8. INSCRIÇÕES_PARTICIPAÇÕES
 */
async function createInscricoesParticipacoes() {
  console.log('\n📋 Criando collection: inscricoes_participacoes');
  
  await createCollectionIfNotExists('inscricoes_participacoes', {
    meta: {
      icon: 'how_to_reg',
      display_template: '{{beneficiaria}} - {{turma_sessao}}',
      sort: 8
    }
  });

  const fields = [
    {
      field: 'presenca',
      type: 'boolean',
      meta: { interface: 'boolean' },
      schema: { default: false, is_nullable: true }
    },
    {
      field: 'certificado_emitido',
      type: 'boolean',
      meta: { interface: 'boolean' },
      schema: { default: false, is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('inscricoes_participacoes', field);
  }

  // Relacionamentos M2O
  console.log('  Criando relacionamentos...');
  
  // beneficiaria
  await createFieldInCollection('inscricoes_participacoes', {
    field: 'beneficiaria',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'inscricoes_participacoes',
    field: 'beneficiaria',
    related_collection: 'beneficiarias',
    meta: { one_field: 'inscricoes' }
  });

  // turma_sessao
  await createFieldInCollection('inscricoes_participacoes', {
    field: 'turma_sessao',
    type: 'integer',
    meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'inscricoes_participacoes',
    field: 'turma_sessao',
    related_collection: 'turmas_sessoes',
    meta: { one_field: 'inscricoes' }
  });
}

// ========================================
// EXECUÇÃO PRINCIPAL
// ========================================

async function main() {
  console.log('🚀 Iniciando configuração do schema no Directus');
  console.log(`📍 URL: ${DIRECTUS_URL}`);
  console.log('⏳ Aguarde...\n');

  try {
    // Criar collections na ordem correta (respeitando dependências)
    await createBeneficiarias();
    await createLocais();
    await createSetores();
    await createAtendimentos();
    await createTramitacoes();
    await createEventosCampanhas();
    await createTurmasSessoes();
    await createInscricoesParticipacoes();

    console.log('\n✅ Schema criado com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('  • beneficiarias');
    console.log('  • locais');
    console.log('  • setores');
    console.log('  • atendimentos (com FK para beneficiarias)');
    console.log('  • tramitacoes (com FKs para atendimentos, setores, directus_users)');
    console.log('  • eventos_campanhas');
    console.log('  • turmas_sessoes (com FKs para eventos_campanhas, locais)');
    console.log('  • inscricoes_participacoes (com FKs para beneficiarias, turmas_sessoes)');
    console.log('\n🎉 Acesse o Directus Admin para visualizar as collections!');

  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
    process.exit(1);
  }
}

// Executar
main();
