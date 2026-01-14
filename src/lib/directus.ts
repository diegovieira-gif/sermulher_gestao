import { createDirectus, rest, staticToken } from '@directus/sdk';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';
const directusToken = process.env.DIRECTUS_TOKEN || '';

// Cliente Directus
export const directus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

// Função para testar a conexão
export async function testConnection() {
  try {
    const result = await directus.request(
      // Busca informações do servidor
      fetch(`${directusUrl}/server/info`).then(res => res.json())
    );
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
