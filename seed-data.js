/**
 * Script de Seed de Dados de Teste - Directus
 * Popula o banco de dados com dados realistas seguindo um cenário de teste
 * 
 * Uso: node seed-data.js
 */

import { createDirectus, rest, staticToken, createItem } from '@directus/sdk';

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
 * Gera um CPF fictício válido (apenas formato, não valida dígitos)
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
 * Cria um item em uma collection usando a SDK
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
// FUNÇÕES DE SEED POR COLLECTION
// ========================================

/**
 * 1. CRIAR LOCAIS
 */
async function seedLocais() {
  console.log('\n📍 Criando Locais...');
  
  const locais = [];

  try {
    // Local 1: Centro Comunitário Norte
    const local1 = await criarItem('locais', {
      nome: 'Centro Comunitário Norte',
      endereco: 'Rua das Flores, 123 - Bairro Centro',
      capacidade: 80,
      tipo: 'Centro Comunitário'
    });
    locais.push(local1);
    console.log(`  ✅ Local criado: ID ${local1.id} - ${local1.nome}`);

    // Local 2: Auditório Central
    const local2 = await criarItem('locais', {
      nome: 'Auditório Central',
      endereco: 'Avenida Principal, 456 - Bairro Jardins',
      capacidade: 200,
      tipo: 'Auditório'
    });
    locais.push(local2);
    console.log(`  ✅ Local criado: ID ${local2.id} - ${local2.nome}`);

  } catch (error) {
    console.error('❌ Falha ao criar locais');
    throw error;
  }

  return locais;
}

/**
 * 2. CRIAR EVENTOS/CAMPANHAS
 */
async function seedEventosCampanhas() {
  console.log('\n🎉 Criando Eventos/Campanhas...');
  
  const eventos = [];

  try {
    // Evento 1: Outubro Rosa 2024
    const evento1 = await criarItem('eventos_campanhas', {
      nome: 'Outubro Rosa 2024',
      tipo: 'Campanha',
      data_inicio: '2024-10-01',
      data_fim: '2024-10-31',
      descricao: '<p>Campanha de conscientização sobre o câncer de mama com palestras, exames preventivos e atividades educativas.</p>'
    });
    eventos.push(evento1);
    console.log(`  ✅ Evento criado: ID ${evento1.id} - ${evento1.nome}`);

    // Evento 2: Informática para o Trabalho
    const evento2 = await criarItem('eventos_campanhas', {
      nome: 'Informática para o Trabalho',
      tipo: 'Curso',
      data_inicio: '2024-02-05',
      data_fim: '2024-03-15',
      descricao: '<p>Curso profissionalizante de informática básica voltado para o mercado de trabalho.</p>'
    });
    eventos.push(evento2);
    console.log(`  ✅ Evento criado: ID ${evento2.id} - ${evento2.nome}`);

  } catch (error) {
    console.error('❌ Falha ao criar eventos/campanhas');
    throw error;
  }

  return eventos;
}

/**
 * 3. CRIAR TURMAS/SESSÕES
 */
async function seedTurmasSessoes(eventos, locais) {
  console.log('\n🎓 Criando Turmas/Sessões...');
  
  const turmas = [];

  try {
    // Turma 1: Sessão do Outubro Rosa no Auditório Central
    const turma1 = await criarItem('turmas_sessoes', {
      nome_identificador: 'Dia D - Palestra Saúde',
      evento_pai: eventos[0].id, // Outubro Rosa
      local: locais[1].id, // Auditório Central
      vagas: 150
    });
    turmas.push(turma1);
    console.log(`  ✅ Turma criada: ID ${turma1.id} - ${turma1.nome_identificador}`);

    // Turma 2: Turma de Informática no Centro Comunitário Norte
    const turma2 = await criarItem('turmas_sessoes', {
      nome_identificador: 'Turma Matutina A',
      evento_pai: eventos[1].id, // Informática para o Trabalho
      local: locais[0].id, // Centro Comunitário Norte
      vagas: 25
    });
    turmas.push(turma2);
    console.log(`  ✅ Turma criada: ID ${turma2.id} - ${turma2.nome_identificador}`);

  } catch (error) {
    console.error('❌ Falha ao criar turmas/sessões');
    throw error;
  }

  return turmas;
}

/**
 * 4. CRIAR BENEFICIÁRIA
 */
async function seedBeneficiaria() {
  console.log('\n👤 Criando Beneficiária...');
  
  let beneficiaria = null;

  try {
    const cpfFicticio = gerarCPFFicticio();
    
    beneficiaria = await criarItem('beneficiarias', {
      nome_completo: 'Maria da Silva',
      cpf: cpfFicticio,
      data_nascimento: '1985-05-15',
      contato: {
        telefone: '79999999999',
        email: 'maria.teste@email.com',
        whatsapp: '79999999999'
      },
      endereco: {
        rua: 'Rua das Acácias, 789',
        bairro: 'Bairro São José',
        cidade: 'Aracaju',
        estado: 'SE',
        cep: '49000-000'
      },
      perfil_socioeconomico: 'Mãe solo, 2 filhos menores, desempregada atualmente, buscando recolocação no mercado de trabalho.',
      tags: ['Prioridade', 'Mãe Solo']
    });
    
    console.log(`  ✅ Beneficiária criada: ID ${beneficiaria.id} - ${beneficiaria.nome_completo} (CPF: ${beneficiaria.cpf})`);

  } catch (error) {
    console.error('❌ Falha ao criar beneficiária');
    throw error;
  }

  return beneficiaria;
}

/**
 * 5. CRIAR INSCRIÇÕES/PARTICIPAÇÕES
 */
async function seedInscricoesParticipacoes(beneficiaria, turmas) {
  console.log('\n📝 Criando Inscrições/Participações...');
  
  const inscricoes = [];

  try {
    // Inscrição 1: Maria no Outubro Rosa
    const inscricao1 = await criarItem('inscricoes_participacoes', {
      beneficiaria: beneficiaria.id,
      turma_sessao: turmas[0].id, // Dia D - Palestra Saúde (Outubro Rosa)
      presenca: true,
      certificado_emitido: false
    });
    inscricoes.push(inscricao1);
    console.log(`  ✅ Inscrição criada: ID ${inscricao1.id} - Maria na Palestra de Saúde (Presença: ✓)`);

    // Inscrição 2: Maria no Curso de Informática
    const inscricao2 = await criarItem('inscricoes_participacoes', {
      beneficiaria: beneficiaria.id,
      turma_sessao: turmas[1].id, // Turma Matutina A (Informática)
      presenca: true,
      certificado_emitido: false
    });
    inscricoes.push(inscricao2);
    console.log(`  ✅ Inscrição criada: ID ${inscricao2.id} - Maria no Curso de Informática (Presença: ✓, Certificado: ✗)`);

  } catch (error) {
    console.error('❌ Falha ao criar inscrições/participações');
    throw error;
  }

  return inscricoes;
}

/**
 * 6. CRIAR DADOS COMPLEMENTARES (OPCIONAL)
 */
async function seedDadosComplementares() {
  console.log('\n🏢 Criando dados complementares...');
  
  try {
    // Criar setores
    console.log('  Criando setores...');
    const setorRecepcao = await criarItem('setores', {
      nome: 'Recepção'
    });
    console.log(`    ✅ Setor criado: ID ${setorRecepcao.id} - ${setorRecepcao.nome}`);

    const setorJuridico = await criarItem('setores', {
      nome: 'Jurídico'
    });
    console.log(`    ✅ Setor criado: ID ${setorJuridico.id} - ${setorJuridico.nome}`);

    const setorPsicologico = await criarItem('setores', {
      nome: 'Psicológico'
    });
    console.log(`    ✅ Setor criado: ID ${setorPsicologico.id} - ${setorPsicologico.nome}`);

    return { setorRecepcao, setorJuridico, setorPsicologico };
  } catch (error) {
    console.error('❌ Falha ao criar dados complementares');
    // Não lança erro aqui, pois é complementar
    return null;
  }
}

/**
 * 7. CRIAR ATENDIMENTO DE EXEMPLO (OPCIONAL)
 */
async function seedAtendimentoExemplo(beneficiaria, setores) {
  if (!beneficiaria || !setores) return null;

  console.log('\n📋 Criando atendimento de exemplo...');
  
  try {
    const atendimento = await criarItem('atendimentos', {
      beneficiaria: beneficiaria.id,
      status: 'Em andamento',
      origem: 'Recepção',
      prioridade: 'Normal',
      data_abertura: new Date().toISOString()
    });
    console.log(`  ✅ Atendimento criado: ID ${atendimento.id} - Status: ${atendimento.status}`);

    // Criar uma tramitação de exemplo
    const tramitacao = await criarItem('tramitacoes', {
      atendimento_pai: atendimento.id,
      setor_responsavel: setores.setorPsicologico.id,
      tipo_demanda: 'Terapia',
      relato_tecnico: '<p>Primeira sessão de acolhimento realizada. Beneficiária demonstra interesse em participar do grupo terapêutico.</p>',
      status_etapa: 'Em atendimento',
      data_recebimento: new Date().toISOString()
    });
    console.log(`  ✅ Tramitação criada: ID ${tramitacao.id} - Tipo: ${tramitacao.tipo_demanda}`);

    return { atendimento, tramitacao };
  } catch (error) {
    console.error('❌ Falha ao criar atendimento/tramitação de exemplo');
    return null;
  }
}

// ========================================
// EXECUÇÃO PRINCIPAL
// ========================================

async function main() {
  console.log('🌱 Iniciando seed de dados de teste no Directus');
  console.log(`📍 URL: ${DIRECTUS_URL}`);
  console.log('⏳ Aguarde...\n');

  try {
    // 1. Criar Locais (sem dependências)
    const locais = await seedLocais();

    // 2. Criar Eventos/Campanhas (sem dependências)
    const eventos = await seedEventosCampanhas();

    // 3. Criar Turmas/Sessões (depende de eventos e locais)
    const turmas = await seedTurmasSessoes(eventos, locais);

    // 4. Criar Beneficiária (sem dependências)
    const beneficiaria = await seedBeneficiaria();

    // 5. Criar Inscrições/Participações (depende de beneficiária e turmas)
    const inscricoes = await seedInscricoesParticipacoes(beneficiaria, turmas);

    // 6. Criar dados complementares (setores)
    const setores = await seedDadosComplementares();

    // 7. Criar atendimento de exemplo (opcional)
    const atendimento = await seedAtendimentoExemplo(beneficiaria, setores);

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📊 Resumo dos dados criados:\n');
    
    console.log(`📍 Locais criados: ${locais.length}`);
    locais.forEach((local, idx) => {
      console.log(`   ${idx + 1}. ${local.nome} (ID: ${local.id})`);
    });
    
    console.log(`\n🎉 Eventos/Campanhas criados: ${eventos.length}`);
    eventos.forEach((evento, idx) => {
      console.log(`   ${idx + 1}. ${evento.nome} (ID: ${evento.id})`);
    });
    
    console.log(`\n🎓 Turmas/Sessões criadas: ${turmas.length}`);
    turmas.forEach((turma, idx) => {
      console.log(`   ${idx + 1}. ${turma.nome_identificador} (ID: ${turma.id})`);
    });
    
    console.log(`\n👤 Beneficiária criada:`);
    console.log(`   • ${beneficiaria.nome_completo} (ID: ${beneficiaria.id})`);
    console.log(`   • CPF: ${beneficiaria.cpf}`);
    console.log(`   • E-mail: ${beneficiaria.contato.email}`);
    
    console.log(`\n📝 Inscrições/Participações criadas: ${inscricoes.length}`);
    inscricoes.forEach((inscricao, idx) => {
      console.log(`   ${idx + 1}. Inscrição ID ${inscricao.id} - Presença: ${inscricao.presenca ? '✓' : '✗'}`);
    });

    if (setores) {
      console.log(`\n🏢 Setores criados: 3`);
      console.log(`   • Recepção (ID: ${setores.setorRecepcao.id})`);
      console.log(`   • Jurídico (ID: ${setores.setorJuridico.id})`);
      console.log(`   • Psicológico (ID: ${setores.setorPsicologico.id})`);
    }

    if (atendimento) {
      console.log(`\n📋 Atendimento de exemplo criado:`);
      console.log(`   • Atendimento ID ${atendimento.atendimento.id} - Status: ${atendimento.atendimento.status}`);
      console.log(`   • Tramitação ID ${atendimento.tramitacao.id} - Setor: Psicológico`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Acesse o Directus Admin para visualizar os dados!');
    console.log(`🌐 ${DIRECTUS_URL}/admin/`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERRO DURANTE O SEED');
    console.error('='.repeat(60));
    console.error(error);
    console.error('\n💡 Dica: Verifique se o schema foi criado corretamente antes de rodar o seed.');
    console.error('   Execute: npm run setup-schema\n');
    process.exit(1);
  }
}

// Executar
main();
