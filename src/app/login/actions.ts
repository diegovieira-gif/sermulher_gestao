"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authentication, createDirectus, rest } from "@directus/sdk";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("directus_token");
  cookieStore.delete("directus_refresh_token");
  redirect("/login");
}
