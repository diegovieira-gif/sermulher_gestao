'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';

// Cliente Directus com autenticação
function getAuthClient() {
  return createDirectus(directusUrl)
    .with(authentication('json'))
    .with(rest());
}

export async function login(prevState: { error?: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return {
      error: 'Email e senha são obrigatórios.',
    };
  }

  try {
    const client = getAuthClient();

    // Autentica o usuário
    await client.login(email, password);

    // Obtém o token de acesso
    const token = await client.getToken();

    if (!token) {
      return {
        error: 'Erro ao obter token de autenticação.',
      };
    }

    // Busca os dados do usuário atual
    const user = await client.request(
      readMe({
        fields: ['id', 'email', 'first_name', 'last_name', 'role.name'],
      })
    );

    // Define os cookies
    const cookieStore = await cookies();
    
    // Cookie do token de sessão (HTTPOnly, Secure)
    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });

    // Cookie com a role do usuário (para controle visual)
    if (user.role && typeof user.role === 'object' && 'name' in user.role) {
      cookieStore.set('user_role', user.role.name as string, {
        httpOnly: false, // Permite acesso no client para UI
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    // Cookie com informações do usuário (para exibição)
    cookieStore.set('user_name', `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return {
      error: 'Email ou senha inválidos. Verifique suas credenciais e tente novamente.',
    };
  }

  // Redireciona para o dashboard
  redirect('/dashboard');
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    
    // Remove todos os cookies de autenticação
    cookieStore.delete('session_token');
    cookieStore.delete('user_role');
    cookieStore.delete('user_name');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }

  // Redireciona para a página de login
  redirect('/login');
}
