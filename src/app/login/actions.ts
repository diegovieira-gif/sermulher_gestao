"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authentication, createDirectus, rest, readMe } from "@directus/sdk";
import { revalidatePath } from "next/cache";

export async function login(prevState: any, formData?: FormData) {
  const input = formData || prevState;
  let email = "";
  let password = "";

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
    return { message: "Erro de configuração no servidor." };
  }

  try {
    const client = createDirectus(apiUrl)
      .with(authentication("json"))
      .with(rest());

    // 1. Autenticação
    const response = await client.login(email, password);

    if (!response.access_token || !response.refresh_token) {
      throw new Error("Tokens não recebidos.");
    }

    // 2. Buscar dados do usuário (Nome e Role)
    // O cliente já está autenticado internamente após o login
    const user = await client.request(
      readMe({ fields: ["first_name", "last_name", "role.name"] }),
    );

    const userName = user.first_name
      ? `${user.first_name} ${user.last_name || ""}`
      : email;
    // O Directus retorna a role como objeto ou ID, ajustamos conforme retorno
    const userRole =
      typeof user.role === "object" && user.role
        ? (user.role as any).name
        : "Usuário";

    // 3. Salvar Cookies
    const cookieStore = await cookies();

    const cookieOptions = {
      httpOnly: true,
      secure: false, // IP Local
      path: "/",
      sameSite: "lax" as const,
    };

    // Tokens (Segurança - httpOnly)
    cookieStore.set("directus_token", response.access_token, {
      ...cookieOptions,
      maxAge: 900, // 15 min
    });

    cookieStore.set("directus_refresh_token", response.refresh_token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60,
    });

    // Dados do Usuário (Acessíveis via JS no cliente? Não por padrão com httpOnly)
    // Para o Header ler, precisamos que NÃO seja httpOnly ou criar uma API de profile.
    // Vamos usar httpOnly: false APENAS para nome e role para facilitar a leitura no Header.tsx

    cookieStore.set("user_name", userName, {
      ...cookieOptions,
      httpOnly: false, // Permitir leitura no cliente
      maxAge: 7 * 24 * 60 * 60,
    });

    cookieStore.set("user_role", userRole || "Admin", {
      ...cookieOptions,
      httpOnly: false, // Permitir leitura no cliente
      maxAge: 7 * 24 * 60 * 60,
    });
  } catch (error: any) {
    console.error("[Login] Falha:", error);
    let msg = "Credenciais inválidas.";
    if (error?.errors?.[0]?.message) msg = error.errors[0].message;
    else if (error.message) msg = error.message;
    return { message: msg };
  }

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("directus_token");
  cookieStore.delete("directus_refresh_token");
  cookieStore.delete("user_name");
  cookieStore.delete("user_role");

  revalidatePath("/", "layout");
  revalidatePath("/", "layout");

  redirect("/login");
}
