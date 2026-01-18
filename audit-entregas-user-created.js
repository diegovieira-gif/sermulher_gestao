// audit-entregas-user-created.js
// Audita se o campo user_created está sendo preenchido nas entregas
// Uso: node audit-entregas-user-created.js

import dotenv from 'dotenv';
import {
  createDirectus,
  staticToken,
  rest,
  readItems,
  readFields,
} from '@directus/sdk';

dotenv.config({ path: '.env.local' });

const DIRECTUS_URL = process.env.DIRECTUS_API_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error('❌ Erro: defina DIRECTUS_API_URL (ou NEXT_PUBLIC_DIRECTUS_URL) e DIRECTUS_TOKEN em .env.local');
  process.exit(1);
}

const client = createDirectus(DIRECTUS_URL).with(staticToken(DIRECTUS_TOKEN)).with(rest());

async function main() {
  console.log('🔍 Auditoria: Verificando campo user_created em entregas_beneficios\n');

  try {
    // 1. Verifica se o campo existe
    console.log('📋 Passo 1: Verificando estrutura do campo user_created...');
    const fields = await client.request(
      readFields('entregas_beneficios', {
        filter: { field: { _eq: 'user_created' } }
      })
    );

    if (fields.length === 0) {
      console.error('❌ Campo user_created NÃO existe em entregas_beneficios');
      process.exit(1);
    }

    const userCreatedField = fields[0];
    console.log(`   ✓ Campo encontrado:`);
    console.log(`     - Type: ${userCreatedField.type}`);
    console.log(`     - Interface: ${userCreatedField.meta?.interface}`);
    console.log(`     - Special: ${JSON.stringify(userCreatedField.meta?.special)}`);
    console.log('');

    // 2. Busca alguns registros recentes
    console.log('📋 Passo 2: Analisando registros recentes...');
    const entregas = await client.request(
      readItems('entregas_beneficios', {
        limit: 10,
        sort: ['-date_created'],
        fields: [
          'id',
          'date_created',
          'user_created',
          'beneficiaria.id',
          'beneficiaria.nome_completo',
          'beneficio.id',
          'beneficio.nome',
        ]
      })
    );

    if (entregas.length === 0) {
      console.log('   ℹ️  Nenhuma entrega registrada ainda.');
      console.log('\n✅ Auditoria concluída. A coleção está vazia, mas a estrutura está OK.');
      process.exit(0);
    }

    console.log(`   ✓ ${entregas.length} registros encontrados\n`);

    let userCreatedPopulated = 0;
    let userCreatedEmpty = 0;

    entregas.forEach((entrega, index) => {
      const hasUser = entrega.user_created && typeof entrega.user_created === 'object' && entrega.user_created.id;
      
      if (hasUser) {
        userCreatedPopulated++;
      } else {
        userCreatedEmpty++;
      }

      const status = hasUser ? '✓' : '✗';
      console.log(`   ${status} Entrega #${entrega.id}:`);
      console.log(`     - Data criação: ${entrega.date_created}`);
      console.log(`     - Beneficiária: ${entrega.beneficiaria?.nome_completo || 'N/A'}`);
      console.log(`     - Benefício: ${entrega.beneficio?.nome || 'N/A'}`);
      console.log(`     - user_created: ${hasUser ? JSON.stringify(entrega.user_created) : '(vazio/null)'}`);
      console.log('');
    });

    // 3. Resumo
    console.log('📊 Resumo da Auditoria:');
    console.log(`   ✓ Registros com user_created: ${userCreatedPopulated}/${entregas.length}`);
    console.log(`   ✗ Registros sem user_created: ${userCreatedEmpty}/${entregas.length}`);

    if (userCreatedEmpty > 0) {
      console.log('\n⚠️  PROBLEMA DETECTADO:');
      console.log('   O campo user_created não está sendo preenchido automaticamente.');
      console.log('   Possíveis causas:');
      console.log('   1. A auditoria do Directus está desativada para a collection');
      console.log('   2. O campo não tem a propriedade "accountability" configurada');
      console.log('   3. Os registros foram criados antes de adicionar o campo');
      console.log('\n🔧 Solução:');
      console.log('   - Verifique em Directus > Settings > Collections > entregas_beneficios');
      console.log('   - Ative "Track Changes" (auditoria)');
      console.log('   - Recrie os registros existentes ou use um script de migração');
    } else {
      console.log('\n✅ Todos os registros têm user_created preenchido!');
    }

  } catch (error) {
    console.error('❌ Erro durante a auditoria:', error?.message || error);
    process.exit(1);
  }
}

main();
