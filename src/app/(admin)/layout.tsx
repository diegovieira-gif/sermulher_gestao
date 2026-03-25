import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { LayoutClient } from './layout-client';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/beneficiarias': 'Beneficiárias',
  '/atendimentos': 'Atendimentos',
  '/mulheres': 'Módulo Mulheres',
  '/sala-azul': 'Sala Azul',
  '/eventos': 'Eventos e Campanhas',
  '/configuracoes': 'Configurações',
  '/admin/observatorio': 'Observatório',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'visitante';

  return (
    <SidebarProvider>
      <Sidebar userRole={userRole} />
      <SidebarInset>
        <LayoutClient pageTitles={pageTitles}>{children}</LayoutClient>
      </SidebarInset>
    </SidebarProvider>
  );
}
