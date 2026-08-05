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
import {
  ipDaRequisicao,
  limparFalhas,
  registrarFalha,
  segundosParaLiberar,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Chaves fora do try: precisam estar visíveis no catch para registrar falha.
  let chaveIp = "";
  let chaveEmail = "";
  try {
    // O WAF adora requisições JSON. Ele vai deixar passar!
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // Proteção contra força bruta: IP e e-mail contam separadamente, para que
    // um atacante distribuído não escape trocando de conta, nem um IP
    // compartilhado (rede da prefeitura) seja punido por um vizinho.
    chaveIp = `ip:${ipDaRequisicao(request)}`;
    chaveEmail = `email:${String(email).trim().toLowerCase()}`;
    const espera = Math.max(
      segundosParaLiberar(chaveIp),
      segundosParaLiberar(chaveEmail),
    );
    if (espera > 0) {
      return NextResponse.json(
        {
          error: `Muitas tentativas de login. Aguarde ${Math.ceil(espera / 60)} minuto(s) e tente novamente.`,
        },
        { status: 429, headers: { "Retry-After": String(espera) } },
      );
    }

    // Modo "json": o refresh_token vem no corpo da resposta em vez de um cookie
    // no domínio do Directus — que seria inútil aqui, já que o Next roda em
    // outra origem. Sem isso não há como renovar a sessão.
    const directus = createDirectus<DirectusSchema>(process.env.DIRECTUS_API_URL!)
      .with(rest())
      .with(authentication("json"));

    const authResult = await directus.login(email, password);

    if (!authResult || !authResult.access_token) {
      registrarFalha(chaveIp);
      registrarFalha(chaveEmail);
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    limparFalhas(chaveIp);
    limparFalhas(chaveEmail);

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
    // O SDK lança em credencial errada — a falha conta para o limite.
    if (chaveIp) registrarFalha(chaveIp);
    if (chaveEmail) registrarFalha(chaveEmail);
    return NextResponse.json({ error: "Credenciais inválidas ou erro no servidor." }, { status: 401 });
  }
}
