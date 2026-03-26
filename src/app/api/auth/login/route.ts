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

    // Cria o cookie de sessão seguro no servidor
    const cookieStore = await cookies();
    cookieStore.set("directus_token", authResult.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
