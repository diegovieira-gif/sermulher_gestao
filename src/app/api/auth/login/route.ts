import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createDirectus, rest, authentication, readMe } from "@directus/sdk";
import type { DirectusSchema } from "@/types/database";

export async function POST(request: Request) {
  try {
    // O WAF adora requisições JSON. Ele vai deixar passar!
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const directus = createDirectus<DirectusSchema>(process.env.DIRECTUS_API_URL!)
      .with(rest())
      .with(authentication());

    const authResult = await directus.login(email, password);

    if (!authResult || !authResult.access_token) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Cria o cookie de sessão seguro no servidor.
    // `Secure` precisa acompanhar o protocolo REAL da requisição: navegadores
    // descartam cookies Secure em conexões HTTP (exceto localhost). Como a
    // produção é servida em HTTP puro (http://192.168.0.118:3002), basear em
    // NODE_ENV marcaria Secure indevidamente e o cookie não persistiria —
    // login "dá certo" mas a sessão se perde. Detecta HTTPS via x-forwarded-proto
    // (enviado pelo proxy) com fallback para a URL da requisição.
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const isHttps =
      forwardedProto === "https" ||
      (!forwardedProto && new URL(request.url).protocol === "https:");

    const cookieStore = await cookies();
    cookieStore.set("directus_token", authResult.access_token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      maxAge: authResult.expires || 86400,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Login API] Erro:", error);
    return NextResponse.json({ error: "Credenciais inválidas ou erro no servidor." }, { status: 401 });
  }
}
