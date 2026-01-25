'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createDirectus, rest, authentication, readMe } from '@directus/sdk';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || '';

<<<<<<< HEAD
  console.log(`[Login] Tentativa de login para: ${email}`);

  // Validação básica da URL da API
  const apiUrl = process.env.DIRECTUS_API_URL;
  if (!apiUrl) {
    console.error("[Login] ERRO CRÍTICO: DIRECTUS_API_URL não definida!");
    return redirect("/login?error=Erro%20de%20configuração%20no%20servidor");
  }

  try {
    // Cria cliente Directus
    const client = createDirectus(apiUrl)
      .with(authentication("json"))
      .with(rest());

    console.log("[Login] Conectando ao Directus:", apiUrl);

    // Autenticação
    const response = await client.login(email, password);
    console.log("[Login] Resposta do Directus recebida.");

    if (!response.access_token || !response.refresh_token) {
      throw new Error("Tokens não recebidos do Directus");
    }

    // Manipulação de Cookies (Next.js 15 Async)
    const cookieStore = await cookies();

    // Access Token
    cookieStore.set("directus_token", response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: response.expires ? Math.floor(response.expires / 1000) : 900,
      path: "/",
      sameSite: "lax",
    });

    // Refresh Token
    cookieStore.set("directus_refresh_token", response.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
      sameSite: "lax",
    });

    console.log("[Login] Cookies definidos com sucesso.");
  } catch (error: any) {
    console.error("[Login] Erro detalhado:", error);

    let errorMessage = "Credenciais inválidas";

    if (error?.errors?.[0]?.message) {
      errorMessage = error.errors[0].message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Redireciona de volta com erro
    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  // Sucesso: Redireciona para o dashboard
  redirect("/dashboard");
=======
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
>>>>>>> parent of 97116f6 (Update login flow and Docker Compose Directus config)
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
