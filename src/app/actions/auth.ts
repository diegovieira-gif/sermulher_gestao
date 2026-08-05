"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE, revokeSession } from "@/lib/session";

export async function logout() {
  const cookieStore = await cookies();

  // Invalida o refresh token no Directus antes de esquecê-lo. Sem isto ele
  // seguiria válido por dias, e um cookie vazado continuaria rendendo sessões
  // novas mesmo depois de o usuário ter saído.
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await revokeSession(refreshToken);
  }

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete("user_name");
  cookieStore.delete("user_role");
  redirect("/login");
}
