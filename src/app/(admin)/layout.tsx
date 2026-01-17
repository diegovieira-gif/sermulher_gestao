'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/beneficiarias': 'Beneficiárias',
  '/atendimentos': 'Atendimentos',
  '/mulheres': 'Módulo Mulheres',
  '/sala-azul': 'Sala Azul',
  '/eventos': 'Eventos e Campanhas',
  '/configuracoes': 'Configurações',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'SerMulher';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Sidebar />
      <div className="ml-64 flex flex-col">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6 dark:bg-slate-900">{children}</main>
      </div>
    </div>
  );
}
