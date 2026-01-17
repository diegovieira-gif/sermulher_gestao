// update-schema-rma.js
import { createDirectus, staticToken, rest, readCollections, createCollection, createField, readFields, updateField } from '@directus/sdk';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: '.env.local' });

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Erro: Variáveis de ambiente DIRECTUS_URL ou DIRECTUS_TOKEN não encontradas.');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

async function main() {
  console.log('🚀 Iniciando auditoria e atualização do Schema Directus...');

  try {
    // --- 1. AUDITORIA E SETUP DE EVENTOS ---
    await ensureCollection('eventos_campanhas', {
      note: 'Gestão unificada de Planejamento, Campanhas e Agenda da Secretaria.'
    });

    // Campos necessários para o Planejamento 2026 e Agenda Anual
    await ensureField('eventos_campanhas', 'titulo', { type: 'string', interface: 'input', width: 'full' });
    await ensureField('eventos_campanhas', 'descricao', { type: 'text', interface: 'input-multiline', width: 'full' });
    await ensureField('eventos_campanhas', 'data_inicio', { type: 'dateTime', interface: 'datetime', width: 'half' });
    await ensureField('eventos_campanhas', 'data_fim', { type: 'dateTime', interface: 'datetime', width: 'half' });
    
    // Campo para suportar "Toda dia 01" ou "Mensal" (do Planejamento 2026)
    await ensureField('eventos_campanhas', 'recorrencia', {
      type: 'string',
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Não recorrente', value: 'nao_recorrente' },
          { text: 'Mensal', value: 'mensal' },
          { text: 'Anual', value: 'anual' }
        ]
      },
      width: 'half'
    });

    await ensureField('eventos_campanhas', 'tipo', {
      type: 'string',
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Campanha', value: 'campanha' }, // Ex: Outubro Rosa
          { text: 'Evento Oficial', value: 'evento' },
          { text: 'Roda de Conversa', value: 'roda_conversa' }, // Ex: Sala Azul
          { text: 'Curso/Formação', value: 'curso' }
        ]
      },
      width: 'half'
    });

    await ensureField('eventos_campanhas', 'status', {
      type: 'string',
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Planejado', value: 'planejado' },
          { text: 'Confirmado', value: 'confirmado' },
          { text: 'Realizado', value: 'realizado' },
          { text: 'Cancelado', value: 'cancelado' }
        ]
      },
      defaultValue: 'planejado',
      width: 'half'
    });

    // --- 2. SETUP PARA RMA (BENEFICIÁRIAS) ---
    // Necessário para o Bloco B do RMA
    await ensureField('beneficiarias', 'recebe_bolsa_familia', {
      type: 'boolean',
      interface: 'boolean',
      note: 'Indica se a usuária recebe Bolsa Família (Dado para RMA)',
      width: 'half'
    });

    await ensureField('beneficiarias', 'recebe_bpc', {
      type: 'boolean',
      interface: 'boolean',
      note: 'Indica se a usuária recebe BPC (Dado para RMA)',
      width: 'half'
    });
    
    await ensureField('beneficiarias', 'possui_medida_protetiva', {
      type: 'boolean',
      interface: 'boolean',
      note: 'Possui medida protetiva ativa? (Dado para RMA)',
      width: 'half'
    });

    // --- 3. SETUP PARA RMA (ATENDIMENTOS) ---
    // Necessário para o Bloco C do RMA (Encaminhamentos exatos)
    await ensureField('atendimentos', 'encaminhamento_rma', {
      type: 'string',
      interface: 'select-dropdown',
      note: 'Para qual setor a mulher foi encaminhada (Baseado no RMA)',
      options: {
        choices: [
          { text: 'Sem Encaminhamento', value: 'nenhum' },
          { text: 'CRAS', value: 'cras' },
          { text: 'CREAS', value: 'creas' },
          { text: 'Saúde', value: 'saude' },
          { text: 'Educação', value: 'educacao' },
          { text: 'Terceiro Setor', value: 'terceiro_setor' },
          { text: 'Casa Abrigo', value: 'casa_abrigo' },
          { text: 'Delegacia (DAGV)', value: 'delegacia' }
        ]
      },
      width: 'full'
    });

    // Necessário para detalhar o tipo de violência (Pode ser múltiplo)
    // Usaremos CSV para permitir múltipla escolha simples
    await ensureField('atendimentos', 'tipos_violencia', {
      type: 'csv', 
      interface: 'select-multiple-dropdown',
      note: 'Tipos de violência identificados no atendimento',
      options: {
        choices: [
          { text: 'Física', value: 'fisica' },
          { text: 'Psicológica', value: 'psicologica' },
          { text: 'Sexual', value: 'sexual' },
          { text: 'Patrimonial', value: 'patrimonial' },
          { text: 'Moral', value: 'moral' }
        ]
      },
      width: 'full'
    });

    console.log('✅ Atualização do schema concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

// --- FUNÇÕES AUXILIARES DE AUDITORIA ---

async function ensureCollection(collectionName, meta = {}) {
  try {
    const existing = await client.request(readCollections());
    const found = existing.find(c => c.collection === collectionName);

    if (found) {
      console.log(`ℹ️  Collection [${collectionName}] já existe. Pulando criação.`);
    } else {
      console.log(`✨ Criando collection [${collectionName}]...`);
      await client.request(createCollection({
        collection: collectionName,
        schema: {},
        meta: {
          ...meta,
          singleton: false
        }
      }));
    }
  } catch (e) {
    console.error(`Erro ao verificar collection ${collectionName}:`, e.message);
  }
}

async function ensureField(collection, field, schemaInfo) {
  try {
    // 1. Verifica se o campo já existe
    const existingFields = await client.request(readFields(collection));
    const found = existingFields.find(f => f.field === field);

    if (found) {
      console.log(`ℹ️  Campo [${collection}.${field}] já existe. Verificando atualizações...`);
    } else {
      console.log(`➕ Adicionando campo [${collection}.${field}]...`);
      await client.request(createField(collection, {
        field: field,
        type: schemaInfo.type,
        meta: {
          interface: schemaInfo.interface,
          options: schemaInfo.options,
          width: schemaInfo.width || 'full',
          note: schemaInfo.note
        },
        schema: {
          default_value: schemaInfo.defaultValue
        }
      }));
    }
  } catch (e) {
    console.error(`Erro ao manipular campo ${collection}.${field}:`, e.message);
  }
}

main();