import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  isAccessTokenUsable,
  isHttpsRequest,
  refreshCookieOptions,
  refreshSession,
  shouldRefresh,
} from "@/lib/session";

/** Remove os cookies de sessão de uma resposta. */
function limparSessao(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete("user_name");
  response.cookies.delete("user_role");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORREÇÃO: Verificar o cookie 'directus_token' que é gravado no login.
  // Um cookie presente mas VAZIO conta como "sem sessão" (um `directus_token=`
  // forjado não deve passar pela barreira de navegação).
  const sessionToken = request.cookies.get(ACCESS_COOKIE)?.value || null;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value || null;

  // Rotas públicas (que não precisam de login)
  const isPublicRoute = pathname === "/login";

  // Rotas protegidas: Tudo que NÃO for público e NÃO for estático
  // Isso garante que /dashboard, /tramitacoes, etc sejam protegidas
  const isProtectedRoute = !isPublicRoute;

  // 1. Proteção: Se tenta acessar rota protegida SEM token -> Manda pro Login
  //    (a menos que exista refresh token: aí a sessão ainda pode ser salva)
  if (isProtectedRoute && !sessionToken && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    // Salva a url de origem para redirecionar depois (opcional)
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirecionamento: Se tenta acessar Login COM token -> Manda pro Dashboard
  // Mas se a URL tiver parâmetro de erro (ex: token expirou/inválido), limpamos os cookies e permitimos o acesso ao Login
  const hasAuthError = request.nextUrl.searchParams.has("error");

  if (isPublicRoute && hasAuthError) {
    return limparSessao(NextResponse.next());
  }

  if (isPublicRoute && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Raiz (/): Redireciona baseado se está logado ou não
  if (pathname === "/") {
    if (sessionToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 4. Renovação da sessão.
  //
  // O access token do Directus dura ~15 min. Sem renovar, o usuário era jogado
  // de volta ao login no meio do trabalho. Aqui o token é trocado ANTES de
  // expirar (ver REFRESH_THRESHOLD_SECONDS), de forma transparente.
  //
  // Cuidado com corrida: o Directus ROTACIONA o refresh token — o antigo morre
  // assim que /auth/refresh responde. Requisições paralelas (prefetch de links,
  // múltiplos RSC) podem tentar renovar com o mesmo token, e só uma vence.
  // Por isso a regra abaixo: falhou a renovação mas o access token AINDA é
  // válido → segue a viagem sem mexer em cookie algum. A resposta vencedora já
  // gravou o par novo; a perdedora não pode desfazer isso nem derrubar a
  // sessão. Só derruba quando não há mais token utilizável — que é exatamente
  // o comportamento de hoje.
  const precisaRenovar =
    isProtectedRoute &&
    refreshToken !== null &&
    (sessionToken === null || shouldRefresh(sessionToken));

  if (precisaRenovar) {
    const renovado = await refreshSession(refreshToken);

    if (renovado) {
      const response = NextResponse.next();
      const secure = isHttpsRequest(request);
      response.cookies.set(
        ACCESS_COOKIE,
        renovado.accessToken,
        accessCookieOptions(secure, renovado.expiresIn),
      );
      response.cookies.set(
        REFRESH_COOKIE,
        renovado.refreshToken,
        refreshCookieOptions(secure),
      );
      return response;
    }

    // Renovação falhou. Se o token atual ainda serve, o usuário não percebe:
    // pode ter sido apenas uma corrida perdida.
    if (sessionToken && isAccessTokenUsable(sessionToken)) {
      return NextResponse.next();
    }

    // Sem token utilizável: sessão encerrada de fato.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");
    return limparSessao(NextResponse.redirect(loginUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o proxy em todas as rotas, EXCETO:
     * - _next/static (arquivos estáticos do next)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos com extensão (ex: .svg, .png, .css)
     * - /api (rotas de API costumam tratar auth internamente ou serem públicas)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
