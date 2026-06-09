'use client';

import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { usePathname, useRouter } from 'next/navigation';
import { resolveMenuKey } from '@/lib/menu-registry';

interface LayoutClientProps {
  children: React.ReactNode;
  pageTitles: Record<string, string>;
  userName?: string;
  userRole?: string;
  allowedKeys?: string[];
  isAdmin?: boolean;
}

export function LayoutClient({
  children,
  pageTitles,
  userName,
  userRole,
  allowedKeys = [],
  isAdmin = false,
}: LayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || 'SERMULHER';

  // Guarda de navegação: bloqueia acesso direto por URL a seções não
  // permitidas ao perfil. Admins têm acesso irrestrito. (Os dados em si
  // continuam protegidos pelas permissões do Directus.)
  const menuKey = resolveMenuKey(pathname);
  const blocked =
    !isAdmin && menuKey !== null && !allowedKeys.includes(menuKey);

  useEffect(() => {
    if (blocked) {
      router.replace('/dashboard');
    }
  }, [blocked, router]);

  return (
    <>
      <Header title={title} userName={userName} userRole={userRole} />
      <main className="flex-1 overflow-y-auto bg-background p-6">
        {blocked ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Redirecionando…
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
