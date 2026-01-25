"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authentication, createDirectus, rest } from "@directus/sdk";
import { revalidatePath } from "next/cache";

// Assinatura compatível com useActionState: (estadoAnterior, formData)
export async function login(prevState: any, formData?: FormData) {
  // DECISÃO INTELIGENTE:
  // Se o 2º argumento existe, é uma chamada via formulário do React (useActionState).
  // Se não, é uma chamada direta via código (login({ email: ... })).
  const input = formData || prevState;

  let email = "";
  let password = "";

  // --- Bloco de Extração ---
  try {
    // Verifica se é FormData (tem método .get)
    const isFormData = input && typeof input.get === "function";

    if (isFormData) {
      email = String(input.get("email") || "");
      password = String(input.get("password") || "");

      // Debug
      console.log("[Login] Dados recebidos via FormData.");
    } else if (input && typeof input === "object") {
      // Objeto JSON direto
      email = String(input.email || "");
      password = String(input.password || "");
      console.log("[Login] Dados recebidos via Objeto JSON.");
    } else {
      console.error("[Login] Formato de entrada desconhecido:", typeof input);
    }
  } catch (err) {
    console.error("[Login] Erro na extração:", err);
  }
  // ------------------------

  console.log(`[Login] Processando login para: ${email}`);

  // Validação
  if (!email || !password) {
    // Retorna erro para o estado do formulário em vez de redirecionar (melhor UX)
    return { message: "Por favor, preencha email e senha." };
  }

  const apiUrl = process.env.DIRECTUS_API_URL;
  if (!apiUrl) {
    console.error("[Login] ERRO CRÍTICO: DIRECTUS_API_URL ausente");
    return { message: "Erro de configuração no servidor." };
  }

  try {
    const client = createDirectus(apiUrl)
      .with(authentication("json"))
      .with(rest());

    console.log("[Login] Conectando Directus...");
    const response = await client.login(email, password);

    if (!response.access_token || !response.refresh_token) {
      throw new Error("Tokens não recebidos");
    }

    const cookieStore = await cookies();

    // CONFIGURAÇÃO DE COOKIE PARA HTTP (evita bloqueio de envio em HTTP)
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Em ambientes sem HTTPS (acesso via IP/HTTP)
      path: "/",
      sameSite: "lax" as const,
    };

    cookieStore.set("directus_token", response.access_token, {
      ...cookieOptions,
      maxAge: response.expires ? Math.floor(response.expires / 1000) : 900,
    });

    cookieStore.set("directus_refresh_token", response.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch (error: any) {
    console.error("[Login] Falha:", error);

    let msg = "Credenciais inválidas.";
    if (error?.errors?.[0]?.message) msg = error.errors[0].message;
    else if (error.message) msg = error.message;

    // Retorna o erro para ser exibido na tela (state.message)
    return { message: msg };
  }

  // Sucesso: Redirecionamento final
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("directus_token");
  cookieStore.delete("directus_refresh_token");
  revalidatePath("/", "layout");
  redirect("/login");
}
