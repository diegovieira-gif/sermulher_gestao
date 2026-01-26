"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  LogOut,
  HeartHandshake,
  ChevronDown,
  ChevronRight,
  GitPullRequest,
  GraduationCap,
  ShieldAlert,
  Book,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";

interface MenuItemConfig {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
  items?: { label: string; href: string }[];
}

const MENU_ITEMS: MenuItemConfig[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [],
  },
  {
    label: "Gestão de Demandas",
    href: "/tramitacoes",
    icon: GitPullRequest,
    roles: [],
  },
  {
    label: "Agenda Institucional",
    href: "/eventos",
    icon: Calendar,
    roles: [],
  },
  {
    label: "Marketing e Comunicação",
    href: "/marketing",
    icon: Megaphone,
    roles: [],
  },
  {
    label: "Gestão de Mulheres",
    href: "/mulheres",
    icon: HeartHandshake,
    roles: [],
    items: [
      { label: "Indicadores", href: "/mulheres" },
      { label: "Beneficiárias", href: "/mulheres/beneficiarias" },
      { label: "Atendimentos", href: "/mulheres/atendimentos" },
    ],
  },
  {
    label: "Escola da Mulher",
    href: "/escola",
    icon: GraduationCap,
    roles: [],
    items: [
      { label: "Painel da Escola", href: "/escola" },
      { label: "Cursos", href: "/escola/cursos" }, // NOVO ITEM ADICIONADO
      { label: "Turmas", href: "/escola/turmas" },
      { label: "Matrículas", href: "/escola/matriculas" },
    ],
  },
  {
    label: "Sala Azul",
    href: "/sala-azul",
    icon: ShieldAlert,
    roles: [],
    items: [
      { label: "Painel Sala Azul", href: "/sala-azul" },
      { label: "Ciclos Reflexivos", href: "/sala-azul/ciclos" },
      { label: "Infratores", href: "/sala-azul/infratores" },
    ],
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: FileText,
    roles: ["admin", "gestor"],
    items: [{ label: "RMA (SUAS)", href: "/relatorios/rma" }],
  },
  {
    label: "Manual do Usuário",
    href: "/manual",
    icon: Book,
    roles: [],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 -translate-x-full border-r border-slate-800 bg-slate-900 transition-transform sm:translate-x-0 flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">SerMulher</h1>
          <p className="text-[10px] text-slate-400">
            Secretaria Municipal do Respeito às Políticas para as Mulheres
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        <ul className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = item.items && item.items.length > 0;
            const isSubmenuOpen = openSubmenus.includes(item.label);
            const isChildActive =
              hasSubmenu &&
              item.items?.some((sub) => pathname.startsWith(sub.href));

            return (
              <li key={item.href}>
                {hasSubmenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                        isChildActive
                          ? "text-white bg-slate-800/50"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {isSubmenuOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {(isSubmenuOpen || isChildActive) && (
                      <ul className="mt-1 space-y-1 px-2">
                        {item.items!.map((subItem) => {
                          const isSubActive =
                            pathname === subItem.href ||
                            pathname.startsWith(subItem.href + "/");
                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "block rounded-lg px-4 py-2 text-sm transition-colors ml-8 border-l border-slate-700",
                                  isSubActive
                                    ? "text-blue-400 border-blue-500 bg-slate-800/30"
                                    : "text-slate-400 hover:text-white hover:border-slate-500",
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
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                      pathname === item.href ||
                        (pathname.startsWith(item.href + "/") &&
                          item.href !== "/")
                        ? "bg-slate-800 text-white border-l-4 border-blue-500"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
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

      <div className="border-t border-slate-800 p-3 shrink-0 space-y-1">
        <Link
          href="/configuracoes"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
            pathname.startsWith("/configuracoes")
              ? "bg-slate-800 text-white border-l-4 border-blue-500"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </Link>

        <form action={handleLogout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </form>

        <div className="mt-2 text-center pb-1">
          <span className="text-[10px] text-slate-600 font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
}
