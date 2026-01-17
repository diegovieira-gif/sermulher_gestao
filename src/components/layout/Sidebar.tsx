'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  CalendarDays,
  BarChart3,
  Settings, 
  LogOut,
  HeartHandshake, // Ícone para Mulheres
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  href: string;
  icon: any;
  items?: { title: string; href: string }[]; // Suporte a submenus
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard', // Ou '/' dependendo da sua home
    icon: LayoutDashboard,
  },
  {
    title: 'Gestão de Mulheres',
    href: '/mulheres',
    icon: HeartHandshake,
    items: [
            {
        title: 'Indicadores',
        href: '/mulheres',
      },
      {
        title: 'Beneficiárias',
        href: '/mulheres/beneficiarias',
      },
      {
        title: 'Atendimentos',
        href: '/mulheres/atendimentos',
      },
    ],
  },
  {
    title: 'Sala Azul',
    href: '/sala-azul',
    icon: AlertTriangle,
    // Se quiser expandir o Sala Azul no futuro, basta adicionar items aqui:
    // items: [ { title: 'Infratores', href: '/sala-azul/infratores' }, ... ]
  },
  {
    title: 'Agenda & Eventos',
    href: '/eventos',
    icon: CalendarDays,
  },
  {
    title: 'Relatório RMA',
    href: '/relatorios/rma',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  // Estado para controlar quais menus estão abertos
  // Inicializa aberto se a rota atual estiver dentro do submenu
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const openInit: string[] = [];
    menuItems.forEach(item => {
      if (item.items && item.items.some(sub => pathname.startsWith(sub.href))) {
        openInit.push(item.title);
      }
    });
    return openInit;
  });

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900 text-slate-300">
      <div className="flex h-full flex-col">
        {/* Logo/Header */}
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <h1 className="text-xl font-bold text-white">SerMulher</h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.items && item.items.length > 0;
              const isActiveParent = pathname.startsWith(item.href) && item.href !== '/dashboard'; // Ajuste conforme sua rota base
              const isOpen = openMenus.includes(item.title);

              return (
                <li key={item.title}>
                  {hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.title)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                          isActiveParent
                            ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        ) : (
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                      
                      {/* Submenu List */}
                      {isOpen && (
                        <ul className="mt-2 space-y-1 px-4 border-l border-slate-700 ml-4">
                          {item.items!.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                                    isSubActive
                                      ? 'text-white bg-slate-800 font-medium'
                                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                        pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="border-t border-slate-800 p-3">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            onClick={() => {
              console.log('Logout');
            }}
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}