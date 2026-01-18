'use client';

import { Header } from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

interface LayoutClientProps {
  children: React.ReactNode;
  pageTitles: Record<string, string>;
}

export function LayoutClient({ children, pageTitles }: LayoutClientProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'SERMULHER';

  return (
    <>
      <Header title={title} />
      <main className="flex-1 overflow-y-auto bg-slate-100 p-6 dark:bg-slate-900">{children}</main>
    </>
  );
}
