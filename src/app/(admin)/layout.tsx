'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/beneficiarias': 'Beneficiárias',
  '/atendimentos': 'Atendimentos',
  '/sala-azul': 'Sala Azul',
  '/eventos': 'Eventos/Cursos',
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Header title={title} />
        <main className="mt-16 p-6">{children}</main>
      </div>
    </div>
  );
}
