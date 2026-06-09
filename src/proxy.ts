import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORREÇÃO: Verificar o cookie 'directus_token' que é gravado no login
  const sessionToken = request.cookies.get("directus_token");

  // Rotas públicas (que não precisam de login)
  const isPublicRoute = pathname === "/login";

  // Rotas protegidas: Tudo que NÃO for público e NÃO for estático
  // Isso garante que /dashboard, /tramitacoes, etc sejam protegidas
  const isProtectedRoute = !isPublicRoute;

  // 1. Proteção: Se tenta acessar rota protegida SEM token -> Manda pro Login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    // Salva a url de origem para redirecionar depois (opcional)
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirecionamento: Se tenta acessar Login COM token -> Manda pro Dashboard
  // Mas se a URL tiver parâmetro de erro (ex: token expirou/inválido), limpamos os cookies e permitimos o acesso ao Login
  const hasAuthError = request.nextUrl.searchParams.has("error");

  if (isPublicRoute && hasAuthError) {
    const response = NextResponse.next();
    response.cookies.delete("directus_token");
    response.cookies.delete("user_name");
    response.cookies.delete("user_role");
    return response;
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
