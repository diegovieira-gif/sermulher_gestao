import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { LayoutClient } from './layout-client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { directus, safeDirectusCall } from '@/lib/directus';
import { readMe } from '@directus/sdk';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/beneficiarias': 'Beneficiárias',
  '/atendimentos': 'Atendimentos',
  '/mulheres': 'Módulo Mulheres',
  '/sala-azul': 'Sala Azul',
  '/eventos': 'Eventos e Campanhas',
  '/configuracoes': 'Configurações',
  '/observatorio': 'Observatório',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userRoleCookie = cookieStore.get('user_role')?.value || 'visitante';
  
  let userData = {
    firstName: 'Usuário',
    role: userRoleCookie
  };

  const user = await safeDirectusCall(() => 
    directus.request(readMe({ 
      fields: ['first_name', 'role.name'] 
    }))
  );
  
  if (user) {
    userData = {
      firstName: user.first_name || 'Usuário',
      role: (user.role as any)?.name || userRoleCookie
    };
  }

  return (
    <SidebarProvider>
      <Sidebar userRole={userRoleCookie} />
      <SidebarInset>
        <LayoutClient 
          pageTitles={pageTitles} 
          userName={userData.firstName} 
          userRole={userData.role}
        >
          {children}
        </LayoutClient>
      </SidebarInset>
    </SidebarProvider>
  );
}
