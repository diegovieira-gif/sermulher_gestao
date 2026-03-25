import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LayoutClient } from './layout-client';
import { SidebarProvider } from '@/components/ui/sidebar';

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
  // Ler o cookie user_role (padrão: 'visitante' se não existir)
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'visitante';

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900 w-full">
        <Sidebar userRole={userRole} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <LayoutClient pageTitles={pageTitles}>{children}</LayoutClient>
        </div>
      </div>
    </SidebarProvider>
  );
}
