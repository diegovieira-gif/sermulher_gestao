"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authentication, createDirectus, rest } from "@directus/sdk";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Log para Debug (Remover senhas em produção real se não for ambiente seguro)
  console.log(`[Login] Tentativa de login para: ${email}`);
  console.log(`[Login] URL Directus: ${process.env.DIRECTUS_API_URL}`);

  if (!process.env.DIRECTUS_API_URL) {
    console.error("[Login] ERRO CRÍTICO: DIRECTUS_API_URL não definida!");
    return redirect(
      "/login?error=Erro%20de%20configura%C3%A7%C3%A3o%20no%20servidor",
    );
  }

  try {
    const client = createDirectus(process.env.DIRECTUS_API_URL)
      .with(authentication("json"))
      .with(rest());

    console.log("[Login] Enviando requisição ao Directus...");

    const response = await client.login(email, password);

    console.log("[Login] Sucesso! Token recebido.");

    if (!response.access_token || !response.refresh_token) {
      throw new Error("Tokens não recebidos do Directus");
    }

    // Configura cookies
    const cookieStore = await cookies();

    // Access Token (curta duração)
    cookieStore.set("directus_token", response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: response.expires || 900, // 15 min default
      path: "/",
      sameSite: "lax",
    });

    // Refresh Token (longa duração)
    cookieStore.set("directus_refresh_token", response.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: "/",
      sameSite: "lax",
    });

    console.log("[Login] Cookies definidos. Redirecionando para /dashboard");
  } catch (error: any) {
    console.error("[Login] Erro na autenticação:", error);

    let errorMessage = "Credenciais inválidas";

    // Tenta extrair mensagem de erro do Directus
    if (error?.errors?.[0]?.message) {
      errorMessage = error.errors[0].message;
      console.error("[Login] Mensagem Directus:", errorMessage);
    } else if (error.message) {
      errorMessage = error.message;
    }

    return redirect(`/login?error=${encodeURIComponent(errorMessage)}`);
  }

  // Redirecionamento fora do try/catch (padrão Next.js)
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("directus_token");
  cookieStore.delete("directus_refresh_token");
  redirect("/login");
}
