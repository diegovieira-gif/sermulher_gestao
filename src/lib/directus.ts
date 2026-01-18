import { createDirectus, rest, staticToken } from '@directus/sdk';
import { cookies } from 'next/headers';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';
const directusToken = process.env.DIRECTUS_TOKEN || '';

// Log de configuração (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('Directus Config:', {
    url: directusUrl || 'NOT SET',
    tokenSet: !!directusToken,
  });
}

// Cliente Directus com token estático (para operações administrativas)
export const directus = createDirectus(directusUrl)
  .with(staticToken(directusToken))
  .with(rest());

// Cliente Directus autenticado (para operações do usuário logado)
export async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token');

  if (!sessionToken?.value) {
    throw new Error('Usuário não autenticado');
  }

  return createDirectus(directusUrl)
    .with(staticToken(sessionToken.value))
    .with(rest());
}

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
