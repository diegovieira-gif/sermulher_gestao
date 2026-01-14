/**
 * Script de Atualização do Schema - Módulo Sala Azul
 * Adiciona collections para gestão de grupos reflexivos com homens autores de violência
 * 
 * Uso: node update-schema-sala-azul.js
 */

import { createDirectus, rest, staticToken } from '@directus/sdk';

// ========================================
// CONFIGURAÇÃO
// ========================================
const DIRECTUS_URL = 'http://192.168.0.115:8055';
const ADMIN_TOKEN = 'j8EbY77uaPAhN0ZnGrDvoQI9VUGTvl_7';

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

/**
 * Cria um item em uma collection
 */
async function criarItem(collection, data) {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/${collection}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error, null, 2));
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`❌ Erro ao criar item na collection '${collection}':`, error.message);
    throw error;
  }
}

// ========================================
// SCHEMAS DAS NOVAS COLLECTIONS
// ========================================

/**
 * 1. INFRATORES
 */
async function createInfratores() {
  console.log('\n📋 Criando collection: infratores');
  
  await createCollectionIfNotExists('infratores', {
    meta: {
      icon: 'person_outline',
      display_template: '{{nome_completo}}',
      note: 'Homens autores de violência em acompanhamento',
      sort: 20
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
      meta: { 
        interface: 'input',
        note: 'CPF único do infrator'
      },
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
      meta: { 
        interface: 'input-code',
        options: { language: 'json' },
        note: 'Telefone, endereço, etc.'
      },
      schema: { is_nullable: true }
    },
    {
      field: 'nivel_periculosidade',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Baixo', value: 'Baixo' },
            { text: 'Médio', value: 'Médio' },
            { text: 'Alto', value: 'Alto' },
            { text: 'Crítico', value: 'Crítico' }
          ]
        }
      },
      schema: { is_nullable: true }
    },
    {
      field: 'tipo_agressao',
      type: 'csv',
      meta: {
        interface: 'select-multiple-dropdown',
        options: {
          choices: [
            { text: 'Física', value: 'Física' },
            { text: 'Psicológica', value: 'Psicológica' },
            { text: 'Moral', value: 'Moral' },
            { text: 'Sexual', value: 'Sexual' },
            { text: 'Patrimonial', value: 'Patrimonial' }
          ]
        }
      },
      schema: { is_nullable: true }
    },
    {
      field: 'numero_processo',
      type: 'string',
      meta: { 
        interface: 'input',
        note: 'Identificador judicial'
      },
      schema: { is_nullable: true }
    },
    {
      field: 'status_legal',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Em cumprimento', value: 'Em cumprimento' },
            { text: 'Concluído', value: 'Concluído' },
            { text: 'Reincidente', value: 'Reincidente' }
          ]
        }
      },
      schema: { default: 'Em cumprimento', is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('infratores', field);
  }
}

/**
 * 2. SALAS AZUL
 */
async function createSalasAzul() {
  console.log('\n📋 Criando collection: salas_azul');
  
  await createCollectionIfNotExists('salas_azul', {
    meta: {
      icon: 'groups',
      display_template: '{{nome_ciclo}}',
      note: 'Grupos reflexivos para homens autores de violência',
      sort: 21
    }
  });

  const fields = [
    {
      field: 'nome_ciclo',
      type: 'string',
      meta: { 
        required: true, 
        interface: 'input',
        note: 'Ex: Ciclo 01/2026 - Manhã'
      },
      schema: { is_nullable: false }
    },
    {
      field: 'data_inicio',
      type: 'date',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    },
    {
      field: 'data_termino',
      type: 'date',
      meta: { interface: 'datetime', display: 'datetime' },
      schema: { is_nullable: true }
    },
    {
      field: 'status',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Planejada', value: 'Planejada' },
            { text: 'Em Andamento', value: 'Em Andamento' },
            { text: 'Finalizada', value: 'Finalizada' }
          ]
        }
      },
      schema: { default: 'Planejada', is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('salas_azul', field);
  }

  // Relacionamentos M2O
  console.log('  Criando relacionamentos...');
  
  // responsavel_tecnico -> directus_users
  await createFieldInCollection('salas_azul', {
    field: 'responsavel_tecnico',
    type: 'uuid',
    meta: { 
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      note: 'Profissional que ministra o grupo'
    },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'salas_azul',
    field: 'responsavel_tecnico',
    related_collection: 'directus_users',
    meta: { one_field: null }
  });

  // local -> locais
  await createFieldInCollection('salas_azul', {
    field: 'local',
    type: 'integer',
    meta: { 
      interface: 'select-dropdown-m2o',
      special: ['m2o'],
      note: 'Local onde acontecem os encontros'
    },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'salas_azul',
    field: 'local',
    related_collection: 'locais',
    meta: { one_field: 'salas_azul' }
  });
}

/**
 * 3. PARTICIPAÇÕES SALA AZUL (Junction Table)
 */
async function createParticipacoesSalaAzul() {
  console.log('\n📋 Criando collection: participacoes_sala_azul');
  
  await createCollectionIfNotExists('participacoes_sala_azul', {
    meta: {
      icon: 'how_to_reg',
      display_template: '{{infrator}} - {{sala}}',
      note: 'Registro de participação de infratores nos grupos reflexivos',
      sort: 22
    }
  });

  const fields = [
    {
      field: 'frequencia_percentual',
      type: 'integer',
      meta: { 
        interface: 'input',
        note: 'Percentual de presença (0-100)'
      },
      schema: { default: 0, is_nullable: true }
    },
    {
      field: 'status_participacao',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Cursando', value: 'Cursando' },
            { text: 'Concluído com Êxito', value: 'Concluído com Êxito' },
            { text: 'Reprovado', value: 'Reprovado' },
            { text: 'Evadido', value: 'Evadido' }
          ]
        }
      },
      schema: { default: 'Cursando', is_nullable: true }
    },
    {
      field: 'parecer_psicologico',
      type: 'text',
      meta: { 
        interface: 'input-rich-text-html',
        note: 'ÁREA RESTRITA - Avaliação técnica confidencial'
      },
      schema: { is_nullable: true }
    }
  ];

  for (const field of fields) {
    await createFieldInCollection('participacoes_sala_azul', field);
  }

  // Relacionamentos M2O
  console.log('  Criando relacionamentos...');
  
  // infrator -> infratores
  await createFieldInCollection('participacoes_sala_azul', {
    field: 'infrator',
    type: 'integer',
    meta: { 
      interface: 'select-dropdown-m2o',
      special: ['m2o']
    },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'participacoes_sala_azul',
    field: 'infrator',
    related_collection: 'infratores',
    meta: { one_field: 'participacoes' }
  });

  // sala -> salas_azul
  await createFieldInCollection('participacoes_sala_azul', {
    field: 'sala',
    type: 'integer',
    meta: { 
      interface: 'select-dropdown-m2o',
      special: ['m2o']
    },
    schema: { is_nullable: true }
  });
  await createRelationship({
    collection: 'participacoes_sala_azul',
    field: 'sala',
    related_collection: 'salas_azul',
    meta: { one_field: 'participacoes' }
  });
}

// ========================================
// SEED DE DADOS DE TESTE
// ========================================

/**
 * Gera um CPF fictício válido
 */
function gerarCPFFicticio() {
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  const cpf = [
    random(100, 999),
    random(100, 999),
    random(100, 999),
    random(10, 99)
  ].join('.');
  
  return cpf.replace(/\.(\d{2})$/, '-$1');
}

/**
 * Buscar um local existente
 */
async function buscarLocalExistente() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/items/locais?limit=1`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.data?.[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Buscar um usuário existente (para responsável técnico)
 */
async function buscarUsuarioExistente() {
  try {
    const response = await fetch(`${DIRECTUS_URL}/users?limit=1`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    
    if (!response.ok) return null;
    
    const result = await response.json();
    return result.data?.[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Seed dos dados de teste
 */
async function seedDadosTeste() {
  console.log('\n🌱 Criando dados de teste para Sala Azul...');

  try {
    // 1. Buscar local e usuário existentes
    console.log('\n📍 Buscando dados existentes...');
    const local = await buscarLocalExistente();
    const usuario = await buscarUsuarioExistente();
    
    if (!local) {
      console.log('  ⚠️  Nenhum local encontrado. Criando um...');
      const novoLocal = await criarItem('locais', {
        nome: 'Sala Azul - Centro de Referência',
        endereco: 'Rua dos Psicólogos, 100',
        capacidade: 20,
        tipo: 'Centro Comunitário'
      });
      console.log(`  ✅ Local criado: ID ${novoLocal.id}`);
    } else {
      console.log(`  ✓ Local encontrado: ID ${local.id} - ${local.nome}`);
    }

    if (usuario) {
      console.log(`  ✓ Usuário encontrado: ID ${usuario.id} - ${usuario.first_name || 'Admin'}`);
    }

    // 2. Criar Sala Azul
    console.log('\n🔵 Criando Sala Azul...');
    const sala = await criarItem('salas_azul', {
      nome_ciclo: 'Ciclo 01/2026 - Manhã',
      data_inicio: '2026-01-15',
      data_termino: '2026-06-30',
      status: 'Em Andamento',
      local: local?.id || null,
      responsavel_tecnico: usuario?.id || null
    });
    console.log(`  ✅ Sala criada: ID ${sala.id} - ${sala.nome_ciclo}`);

    // 3. Criar Infratores
    console.log('\n👤 Criando Infratores...');
    
    const infrator1 = await criarItem('infratores', {
      nome_completo: 'João Santos Oliveira',
      cpf: gerarCPFFicticio(),
      data_nascimento: '1988-03-20',
      contato: {
        telefone: '79988881111',
        endereco: 'Rua A, 456 - Bairro São Jorge'
      },
      nivel_periculosidade: 'Médio',
      tipo_agressao: 'Física,Psicológica',
      numero_processo: '0001234-56.2025.8.25.0001',
      status_legal: 'Em cumprimento'
    });
    console.log(`  ✅ Infrator criado: ID ${infrator1.id} - ${infrator1.nome_completo} (Periculosidade: ${infrator1.nivel_periculosidade})`);

    const infrator2 = await criarItem('infratores', {
      nome_completo: 'Carlos Pereira Silva',
      cpf: gerarCPFFicticio(),
      data_nascimento: '1992-11-05',
      contato: {
        telefone: '79977772222',
        endereco: 'Avenida B, 789 - Bairro Centro'
      },
      nivel_periculosidade: 'Baixo',
      tipo_agressao: 'Psicológica',
      numero_processo: '0009876-54.2025.8.25.0001',
      status_legal: 'Em cumprimento'
    });
    console.log(`  ✅ Infrator criado: ID ${infrator2.id} - ${infrator2.nome_completo} (Periculosidade: ${infrator2.nivel_periculosidade})`);

    // 4. Criar Participações
    console.log('\n📝 Criando Participações...');
    
    const participacao1 = await criarItem('participacoes_sala_azul', {
      infrator: infrator1.id,
      sala: sala.id,
      frequencia_percentual: 85,
      status_participacao: 'Cursando',
      parecer_psicologico: '<p>Participante demonstra evolução no controle emocional. Apresenta engajamento nas atividades propostas.</p>'
    });
    console.log(`  ✅ Participação criada: ID ${participacao1.id} - ${infrator1.nome_completo} (Frequência: ${participacao1.frequencia_percentual}%)`);

    const participacao2 = await criarItem('participacoes_sala_azul', {
      infrator: infrator2.id,
      sala: sala.id,
      frequencia_percentual: 95,
      status_participacao: 'Cursando',
      parecer_psicologico: '<p>Boa participação. Demonstra compreensão dos temas abordados e reflexão crítica sobre seu comportamento.</p>'
    });
    console.log(`  ✅ Participação criada: ID ${participacao2.id} - ${infrator2.nome_completo} (Frequência: ${participacao2.frequencia_percentual}%)`);

    return { sala, infrator1, infrator2, participacao1, participacao2 };
    
  } catch (error) {
    console.error('\n❌ Erro ao criar dados de teste:', error);
    throw error;
  }
}

// ========================================
// EXECUÇÃO PRINCIPAL
// ========================================

async function main() {
  console.log('🚀 Iniciando atualização do schema - Módulo Sala Azul');
  console.log(`📍 URL: ${DIRECTUS_URL}`);
  console.log('⏳ Aguarde...\n');

  try {
    // PARTE 1: Criar Collections
    console.log('=' .repeat(60));
    console.log('PARTE 1: CRIAÇÃO DO SCHEMA');
    console.log('='.repeat(60));

    await createInfratores();
    await createSalasAzul();
    await createParticipacoesSalaAzul();

    console.log('\n✅ Schema atualizado com sucesso!');

    // PARTE 2: Seed de Dados
    console.log('\n' + '='.repeat(60));
    console.log('PARTE 2: SEED DE DADOS DE TESTE');
    console.log('='.repeat(60));

    const seedResults = await seedDadosTeste();

    // RESUMO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📊 Resumo:\n');
    
    console.log('📋 Collections criadas/verificadas:');
    console.log('  • infratores (homens autores de violência)');
    console.log('  • salas_azul (grupos reflexivos)');
    console.log('  • participacoes_sala_azul (junction table)');
    
    console.log('\n🔗 Relacionamentos configurados:');
    console.log('  • salas_azul -> directus_users (responsável técnico)');
    console.log('  • salas_azul -> locais (local do grupo)');
    console.log('  • participacoes_sala_azul -> infratores');
    console.log('  • participacoes_sala_azul -> salas_azul');

    if (seedResults) {
      console.log('\n🌱 Dados de teste criados:');
      console.log(`  • 1 Sala Azul: "${seedResults.sala.nome_ciclo}" (Status: ${seedResults.sala.status})`);
      console.log(`  • 2 Infratores:`);
      console.log(`    - ${seedResults.infrator1.nome_completo} (${seedResults.infrator1.nivel_periculosidade})`);
      console.log(`    - ${seedResults.infrator2.nome_completo} (${seedResults.infrator2.nivel_periculosidade})`);
      console.log(`  • 2 Participações vinculadas à sala`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Acesse o Directus Admin para visualizar o módulo Sala Azul!');
    console.log(`🌐 ${DIRECTUS_URL}/admin/`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO DURANTE A ATUALIZAÇÃO');
    console.error('='.repeat(60));
    console.error(error);
    process.exit(1);
  }
}

// Executar
main();
