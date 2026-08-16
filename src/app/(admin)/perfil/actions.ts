"use server";

import { cookies } from "next/headers";
import {
  createDirectus,
  rest,
  authentication,
  readMe,
  updateMe,
} from "@directus/sdk";
import { getDirectusClient, safeDirectusCall } from "@/lib/directus";

const API_URL =
  process.env.DIRECTUS_API_URL ||
  process.env.NEXT_PUBLIC_DIRECTUS_URL ||
  "http://192.168.0.118:8055";

export type MeuPerfil = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  title: string | null;
  location: string | null;
  last_access: string | null;
  role: { id: string; name: string | null } | null;
  /** Contato e consentimento para os avisos de escala em eventos. */
  telefone_notificacao: string | null;
  notificar_whatsapp: boolean | null;
};

/** Dados do usuário logado (a partir do token de sessão). */
export async function getMyProfile(): Promise<
  { success: true; data: MeuPerfil } | { success: false; error: string }
> {
  try {
    const me = await safeDirectusCall(async () => {
      const directus = await getDirectusClient({ requireAuth: true });
      return directus.request(
        readMe({
          fields: [
            "id",
            "first_name",
            "last_name",
            "email",
            "title",
            "location",
            "last_access",
            // @ts-ignore - campos adicionados por migração
            "telefone_notificacao",
            // @ts-ignore
            "notificar_whatsapp",
            // @ts-ignore - relação m2o
            "role.id",
            "role.name",
          ],
        }),
      );
    });
    return { success: true, data: me as unknown as MeuPerfil };
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    return { success: false, error: "Não foi possível carregar o perfil." };
  }
}

/**
 * Salva as preferências de notificação da própria pessoa.
 *
 * Usa `updateMe` com o token de sessão de propósito: o consentimento para
 * receber mensagem no WhatsApp pessoal precisa ser dado — e revogado — pela
 * própria titular, não por alguém com acesso ao Directus. A policy limita a
 * escrita a estes campos do próprio registro.
 */
export async function updateMinhasNotificacoes(input: {
  telefone: string;
  notificarWhatsapp: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Só dígitos: é o formato que o disparo espera, e evita duas grafias na
    // mesma coluna (o mesmo precedente do telefone das beneficiárias).
    const digitos = (input.telefone || "").replace(/\D/g, "");

    if (input.notificarWhatsapp && digitos.length < 10) {
      return {
        success: false,
        error:
          "Para receber por WhatsApp, informe o celular com DDD (ao menos 10 dígitos).",
      };
    }

    const directus = await getDirectusClient({ requireAuth: true });
    await directus.request(
      updateMe({
        telefone_notificacao: digitos || null,
        notificar_whatsapp: input.notificarWhatsapp,
      } as any),
    );

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar preferências de notificação:", error);
    return {
      success: false,
      error: "Não foi possível salvar as preferências. Tente novamente.",
    };
  }
}

/**
 * Altera a senha do próprio usuário.
 * Como o login é o mesmo do Directus, validamos a senha atual fazendo um login
 * efêmero antes de aplicar a nova senha via updateMe (token de sessão).
 */
export async function changeMyPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { currentPassword, newPassword } = input;

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "A nova senha deve ter ao menos 8 caracteres." };
    }
    if (newPassword === currentPassword) {
      return { success: false, error: "A nova senha deve ser diferente da atual." };
    }

    // Descobre o e-mail do usuário logado (token de sessão).
    const me = await safeDirectusCall(async () => {
      const directus = await getDirectusClient({ requireAuth: true });
      return directus.request(readMe({ fields: ["email"] }));
    });
    const email = (me as { email?: string | null })?.email;
    if (!email) {
      return { success: false, error: "Sessão inválida. Faça login novamente." };
    }

    // Valida a senha atual com um login efêmero (não persiste sessão).
    try {
      const verifier = createDirectus(API_URL).with(rest()).with(authentication());
      await verifier.login(email, currentPassword);
    } catch {
      return { success: false, error: "Senha atual incorreta." };
    }

    // Aplica a nova senha usando o token de sessão do próprio usuário.
    const directus = await getDirectusClient({ requireAuth: true });
    await directus.request(updateMe({ password: newPassword } as any));

    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return {
      success: false,
      error: "Não foi possível alterar a senha. Tente novamente.",
    };
  }
}
