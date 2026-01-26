"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authentication, createDirectus, rest } from "@directus/sdk";
import { revalidatePath } from "next/cache";

// Server Action compatível com useActionState e chamadas diretas
export async function login(prevState: any, formData?: FormData) {
  const input = formData || prevState;

  let email = "";
  let password = "";

  // Extração robusta dos dados (FormData ou JSON)
  try {
    const isFormData = input && typeof input.get === "function";

    if (isFormData) {
      email = String(input.get("email") || "");
      password = String(input.get("password") || "");
    } else if (input && typeof input === "object") {
      email = String(input.email || "");
      password = String(input.password || "");
    }
  } catch (err) {
    console.error("[Login] Erro na extração:", err);
  }

  if (!email || !password) {
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

    const response = await client.login(email, password);

    if (!response.access_token || !response.refresh_token) {
      throw new Error("Tokens não recebidos");
    }

    const cookieStore = await cookies();

    // --- CORREÇÃO DEFINITIVA PARA HTTP/IP ---
    const cookieOptions = {
      httpOnly: true,
      // secure: false é OBRIGATÓRIO para funcionar em [http://192.168...](http://192.168...)
      // Se fosse true, o navegador ignoraria o cookie fora de HTTPS/Localhost
      secure: false,
      path: "/",
      sameSite: "lax" as const,
    };

    // Salva Access Token
    cookieStore.set("directus_token", response.access_token, {
      ...cookieOptions,
      maxAge: response.expires ? Math.floor(response.expires / 1000) : 900,
    });

    // Salva Refresh Token
    cookieStore.set("directus_refresh_token", response.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });
  } catch (error: any) {
    console.error("[Login] Falha:", error);

    let msg = "Credenciais inválidas.";
    if (error?.errors?.[0]?.message) msg = error.errors[0].message;
    else if (error.message) msg = error.message;

    return { message: msg };
  }

  // Login com sucesso
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("directus_token");
  cookieStore.delete("directus_refresh_token");
  // Limpa o cache do cliente para evitar ver telas antigas
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("directus_token");
  cookieStore.delete("directus_refresh_token");
  revalidatePath("/", "layout");
  redirect("/login");
}
