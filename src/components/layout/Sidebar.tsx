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
  HeartHandshake,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/login/actions';

interface MenuItemConfig {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
  items?: { label: string; href: string }[];
}

// Constante MENU_ITEMS com regras de acesso baseado em role
const MENU_ITEMS: MenuItemConfig[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [], // Todos logados
  },
  {
    label: 'Gestão de Mulheres',
    href: '/mulheres',
    icon: HeartHandshake,
    roles: [], // Todos logados
    items: [
      {
        label: 'Indicadores',
        href: '/mulheres',
      },
      {
        label: 'Beneficiárias',
        href: '/mulheres/beneficiarias',
      },
      {
        label: 'Atendimentos',
        href: '/mulheres/atendimentos',
      },
    ],
  },
  {
    label: 'Escola da Mulher',
    href: '/escola',
    icon: BookOpen,
    roles: [], // Todos logados
    items: [
      {
        label: 'Catálogo de Cursos',
        href: '/escola/cursos',
      },
      {
        label: 'Gestão de Turmas',
        href: '/escola/turmas',
      },
    ],
  },
  {
    label: 'Sala Azul',
    href: '/sala-azul',
    icon: AlertTriangle,
    roles: [], // Todos logados
  },
  {
    label: 'Agenda & Eventos',
    href: '/eventos',
    icon: CalendarDays,
    roles: [], // Todos logados
  },
  {
    label: 'Comunicação',
    href: '/marketing',
    icon: Megaphone,
    roles: [], // Todos logados
  },
  {
    label: 'Relatório RMA',
    href: '/relatorios/rma',
    icon: BarChart3,
    roles: ['admin', 'gestao', 'assistente_social'], // Recepção não vê
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    roles: ['admin', 'gestao'], // Apenas admin e gestão
  },
];

/**
 * Verifica se um usuário com determinada role tem acesso a um item do menu
 */
function canAccessMenuItem(userRole: string, itemRoles?: string[]): boolean {
  // Se roles está vazio ou undefined, o item é público para todos logados
  if (!itemRoles || itemRoles.length === 0) {
    return true;
  }
  // Verifica se o userRole está no array de roles permitidas
  // Admin sempre tem acesso
  return itemRoles.includes(userRole) || userRole === 'admin' || userRole === 'Administrator';
}

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  
  // Filtrar itens do menu baseado nas roles do usuário
  const filteredMenuItems = MENU_ITEMS.filter(item => 
    canAccessMenuItem(userRole, item.roles)
  );

  // Estado para controlar quais menus estão abertos
  // Inicializa aberto se a rota atual estiver dentro do submenu
  const [openMenus, setOpenMenus] = useState<string[]>(() => {
    const openInit: string[] = [];
    filteredMenuItems.forEach(item => {
      if (item.items && item.items.some(sub => pathname.startsWith(sub.href))) {
        openInit.push(item.label);
      }
    });
    return openInit;
  });

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(t => t !== label) 
        : [...prev, label]
    );
  };

  const handleLogout = async () => {
    await logout();
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
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.items && item.items.length > 0;
              const isActiveParent = pathname.startsWith(item.href) && item.href !== '/dashboard';
              const isOpen = openMenus.includes(item.label);

              return (
                <li key={item.label}>
                  {hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                          isActiveParent
                            ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
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
                                  {subItem.label}
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
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="border-t border-slate-800 p-3">
          <form action={handleLogout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}