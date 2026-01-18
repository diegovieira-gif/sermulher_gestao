import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LayoutClient } from './layout-client';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/beneficiarias': 'Beneficiárias',
  '/atendimentos': 'Atendimentos',
  '/mulheres': 'Módulo Mulheres',
  '/sala-azul': 'Sala Azul',
  '/eventos': 'Eventos e Campanhas',
  '/configuracoes': 'Configurações',
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Sidebar userRole={userRole} />
      <div className="ml-64 flex flex-col">
        <LayoutClient pageTitles={pageTitles}>{children}</LayoutClient>
      </div>
    </div>
  );
}
