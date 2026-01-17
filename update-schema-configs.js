// update-schema-configs.js
import { 
  createDirectus, 
  staticToken, 
  rest, 
  readCollections, 
  createCollection, 
  createField, 
  readFields,
  createItems,
  readItems
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

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

async function main() {
  console.log('🚀 Iniciando criação de collections de configuração...\n');

  try {
    // --- 1. SETUP PARA CONFIG_BAIRROS ---
    console.log('📍 Processando collection [config_bairros]...');
    await ensureCollection('config_bairros', {
      note: 'Tabela auxiliar para padronizar bairros de Aracaju'
    });

    await ensureField('config_bairros', 'nome', {
      type: 'string',
      interface: 'input',
      note: 'Nome do bairro (único)',
      width: 'full',
      unique: true,
      required: true
    });

    await ensureField('config_bairros', 'zona', {
      type: 'string',
      interface: 'select-dropdown',
      note: 'Zona da cidade onde o bairro se localiza (opcional)',
      options: {
        choices: [
          { text: 'Norte', value: 'norte' },
          { text: 'Sul', value: 'sul' },
          { text: 'Leste', value: 'leste' },
          { text: 'Oeste', value: 'oeste' },
          { text: 'Centro', value: 'centro' },
          { text: 'Expansão', value: 'expansao' }
        ]
      },
      width: 'half'
    });

    // --- 2. SETUP PARA CONFIG_BENEFICIOS ---
    console.log('💰 Processando collection [config_beneficios]...');
    await ensureCollection('config_beneficios', {
      note: 'Tabela auxiliar para padronizar benefícios oferecidos'
    });

    await ensureField('config_beneficios', 'nome', {
      type: 'string',
      interface: 'input',
      note: 'Nome do benefício (ex: "Cesta Básica", "Auxílio Aluguel")',
      width: 'full',
      required: true
    });

    await ensureField('config_beneficios', 'descricao', {
      type: 'text',
      interface: 'input-multiline',
      note: 'Descrição detalhada do benefício',
      width: 'full'
    });

    // --- 3. POPULAR COM DADOS INICIAIS ---
    console.log('\n📊 Populando collections com dados iniciais...');
    await populateBairros();
    await populateBeneficios();

    console.log('\n✅ Atualização do schema de configurações concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
    process.exit(1);
  }
}

// --- FUNÇÕES AUXILIARES ---

async function ensureCollection(collectionName, meta = {}) {
  try {
    const existing = await client.request(readCollections());
    const found = existing.find(c => c.collection === collectionName);

    if (found) {
      console.log(`  ℹ️  Collection [${collectionName}] já existe. Pulando criação.`);
    } else {
      console.log(`  ✨ Criando collection [${collectionName}]...`);
      await client.request(createCollection({
        collection: collectionName,
        schema: {},
        meta: {
          ...meta,
          singleton: false,
          hidden: false,
          icon: 'settings'
        }
      }));
    }
  } catch (e) {
    console.error(`  Erro ao verificar collection ${collectionName}:`, e.message);
    throw e;
  }
}

async function ensureField(collection, field, schemaInfo) {
  try {
    // 1. Verifica se o campo já existe
    const existingFields = await client.request(readFields(collection));
    const found = existingFields.find(f => f.field === field);

    if (found) {
      console.log(`  ℹ️  Campo [${collection}.${field}] já existe.`);
    } else {
      console.log(`  ➕ Adicionando campo [${collection}.${field}]...`);
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
          is_unique: schemaInfo.unique || false,
          is_nullable: !schemaInfo.required
        }
      }));
    }
  } catch (e) {
    console.error(`  Erro ao manipular campo ${collection}.${field}:`, e.message);
    throw e;
  }
}

async function populateBairros() {
  try {
    // Verifica se já existem bairros
    const existing = await client.request(
      readItems('config_bairros')
    );

    if (existing.length > 0) {
      console.log(`  ℹ️  Collection [config_bairros] já possui ${existing.length} bairro(s). Pulando população.`);
      return;
    }

    const bairros = [
      { nome: 'Santa Maria', zona: 'sul' },
      { nome: 'Santos Dumont', zona: 'norte' },
      { nome: 'Jabotiana', zona: 'expansao' },
      { nome: 'Peixoto', zona: 'centro' },
      { nome: 'Getúlio Vargas', zona: 'leste' },
      { nome: 'Aeroporto', zona: 'oeste' },
      { nome: 'Coroa do Meio', zona: 'sul' },
      { nome: 'Atalaia', zona: 'sul' }
    ];

    console.log(`  ✨ Inserindo ${bairros.length} bairros...`);
    const result = await client.request(createItems('config_bairros', bairros));
    
    console.log(`  ✅ ${result.length} bairro(s) criado(s) com sucesso!`);
    result.forEach(b => console.log(`     • ${b.nome} (${b.zona})`));

  } catch (error) {
    // Se for erro de duplicata, apenas log
    if (error.message.includes('unique') || error.message.includes('UNIQUE')) {
      console.log(`  ℹ️  Alguns bairros já existem. Pulando duplicatas.`);
    } else {
      console.error(`  Erro ao popular bairros:`, error.message);
      throw error;
    }
  }
}

async function populateBeneficios() {
  try {
    // Verifica se já existem benefícios
    const existing = await client.request(
      readItems('config_beneficios')
    );

    if (existing.length > 0) {
      console.log(`  ℹ️  Collection [config_beneficios] já possui ${existing.length} benefício(s). Pulando população.`);
      return;
    }

    const beneficios = [
      { 
        nome: 'Cesta Básica', 
        descricao: 'Kit de alimentos essenciais para subsistência familiar mensal' 
      },
      { 
        nome: 'Kit Natalidade', 
        descricao: 'Conjunto de itens necessários para gestantes e recém-nascidos (roupas, fraldas, etc)' 
      }
    ];

    console.log(`  ✨ Inserindo ${beneficios.length} benefício(s)...`);
    const result = await client.request(createItems('config_beneficios', beneficios));
    
    console.log(`  ✅ ${result.length} benefício(s) criado(s) com sucesso!`);
    result.forEach(b => console.log(`     • ${b.nome}`));

  } catch (error) {
    // Se for erro de duplicata, apenas log
    if (error.message.includes('unique') || error.message.includes('UNIQUE')) {
      console.log(`  ℹ️  Alguns benefícios já existem. Pulando duplicatas.`);
    } else {
      console.error(`  Erro ao popular benefícios:`, error.message);
      throw error;
    }
  }
}

main();
