import { cookies } from "next/headers";
import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutClient } from "./layout-client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getDirectusClient, safeDirectusCall } from "@/lib/directus";
import { getCurrentAccess } from "@/lib/permissions";
import { readMe } from "@directus/sdk";

type AdminUser = {
  first_name?: string | null;
  role?: {
    name?: string | null;
  } | null;
};

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/beneficiarias": "Beneficiárias",
  "/atendimentos": "Atendimentos",
  "/mulheres": "Módulo Mulheres",
  "/sala-azul": "Sala Azul",
  "/eventos": "Eventos e Campanhas",
  "/configuracoes": "Configurações",
  "/observatorio": "Observatório",
  "/auditoria": "Auditoria",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userRoleCookie = cookieStore.get("user_role")?.value || "visitante";

  let userData = {
    firstName: "Usuário",
    role: userRoleCookie,
  };

  const user = await safeDirectusCall<AdminUser>(async () => {
    const directus = await getDirectusClient({ requireAuth: true });

    return directus.request(
      readMe({
        fields: ["first_name", "role.name"],
      }),
    );
  });

  if (user) {
    userData = {
      firstName: user.first_name || "Usuário",
      role: user.role?.name || userRoleCookie,
    };
  }

  // Permissões de menu por perfil (Configurações → Permissões).
  const access = await getCurrentAccess();

  return (
    <SidebarProvider>
      <Sidebar allowedKeys={access.allowedKeys} />
      <SidebarInset>
        <LayoutClient
          pageTitles={pageTitles}
          userName={userData.firstName}
          userRole={userData.role}
          allowedKeys={access.allowedKeys}
          isAdmin={access.isAdmin}
        >
          {children}
        </LayoutClient>
      </SidebarInset>
    </SidebarProvider>
  );
}
