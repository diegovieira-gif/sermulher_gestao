import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createDirectus, rest, authentication } from "@directus/sdk";
import type { DirectusSchema } from "@/types/database";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  isHttpsRequest,
  refreshCookieOptions,
} from "@/lib/session";

export async function POST(request: Request) {
  try {
    // O WAF adora requisições JSON. Ele vai deixar passar!
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // Modo "json": o refresh_token vem no corpo da resposta em vez de um cookie
    // no domínio do Directus — que seria inútil aqui, já que o Next roda em
    // outra origem. Sem isso não há como renovar a sessão.
    const directus = createDirectus<DirectusSchema>(process.env.DIRECTUS_API_URL!)
      .with(rest())
      .with(authentication("json"));

    const authResult = await directus.login(email, password);

    if (!authResult || !authResult.access_token) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Cria os cookies de sessão no servidor. Ver `isHttpsRequest` para o
    // porquê de o `Secure` seguir o protocolo real da requisição.
    const isHttps = isHttpsRequest(request);

    // `expires` do Directus vem em MILISSEGUNDOS; o `maxAge` do cookie é em
    // SEGUNDOS. Sem a conversão, o cookie vivia ~10 dias enquanto o token
    // expirava em ~15 min → 401 silencioso depois de um tempo logado.
    const expiresMs =
      typeof authResult.expires === "number" ? authResult.expires : 0;
    const maxAgeSeconds = expiresMs > 0 ? Math.floor(expiresMs / 1000) : 86400;

    const cookieStore = await cookies();
    cookieStore.set(
      ACCESS_COOKIE,
      authResult.access_token,
      accessCookieOptions(isHttps, maxAgeSeconds),
    );

    // O refresh token vive muito mais que o access token — é ele que permite
    // ao proxy renovar a sessão sem devolver o usuário à tela de login a cada
    // ~15 minutos.
    if (authResult.refresh_token) {
      cookieStore.set(
        REFRESH_COOKIE,
        authResult.refresh_token,
        refreshCookieOptions(isHttps),
      );
    } else {
      // Sem refresh token a sessão continua funcionando, só que curta — vale
      // registrar porque é a diferença entre "expira em 15 min" e "dura dias".
      console.warn(
        "[Login API] Directus não devolveu refresh_token; a sessão não poderá ser renovada.",
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Login API] Erro:", error);
    return NextResponse.json({ error: "Credenciais inválidas ou erro no servidor." }, { status: 401 });
  }
}
