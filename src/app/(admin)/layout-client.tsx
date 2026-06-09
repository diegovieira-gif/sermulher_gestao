'use client';

import { Header } from '@/components/layout/Header';
import { usePathname } from 'next/navigation';

interface LayoutClientProps {
  children: React.ReactNode;
  pageTitles: Record<string, string>;
  userName?: string;
  userRole?: string;
}

export function LayoutClient({ 
  children, 
  pageTitles, 
  userName, 
  userRole 
}: LayoutClientProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'SERMULHER';

  return (
    <>
      <Header title={title} userName={userName} userRole={userRole} />
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </>
  );
}
