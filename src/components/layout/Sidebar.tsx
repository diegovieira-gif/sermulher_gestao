"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  LogOut,
  HeartHandshake,
  ChevronRight,
  GitPullRequest,
  GraduationCap,
  ShieldAlert,
  Book,
  Megaphone,
  LayoutGrid,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MenuItemConfig {
  label: string;
  href: string;
  icon: any;
  roles?: string[];
  items?: { label: string; href: string; icon?: any }[];
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
      { label: "Cursos", href: "/escola/cursos" },
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
    items: [
      { label: "Indicadores Gerais", href: "/relatorios/indicadores" },
      { label: "RMA (SUAS)", href: "/relatorios/rma" },
    ],
  },
  {
    label: "Observatório",
    href: "/observatorio",
    icon: LayoutDashboard,
    roles: ["admin", "gestor"],
  },
  {
    label: "App Amar",
    href: "/app-amar",
    icon: HeartHandshake,
    roles: ["admin", "gestor"],
    items: [
      { label: "Categorias", href: "/app-amar/categorias", icon: LayoutGrid },
      { label: "Serviços", href: "/app-amar/servicos", icon: Briefcase },
      { label: "Campanhas", href: "/app-amar/campanhas", icon: Megaphone },
      { label: "Sonhos", href: "/app-amar/sonhos", icon: HeartHandshake },
      { label: "Cursos", href: "/app-amar/cursos", icon: GraduationCap },
      { label: "Contatos", href: "/app-amar/contatos", icon: FileText },
      { label: "Projetos", href: "/app-amar/projetos", icon: Calendar },
    ],
  },
];

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();

  const handleLogout = async () => {
    await logout();
  };

  // RBAC logic: Filter menu items
  // Roles: 'Busca Ativa' or 'Recepção' only see 'Gestão de Mulheres'
  const isLimited = userRole === "Busca Ativa" || userRole === "Recepção";

  const filteredMenuItems = isLimited
    ? MENU_ITEMS.filter((item) => item.label === "Gestão de Mulheres")
    : MENU_ITEMS;

  return (
    <ShadcnSidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="gap-3">
                <div className="flex aspect-square size-10 items-center justify-center shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo Secretaria"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-slate-900 dark:text-white">
                    SERMULHER
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight break-words whitespace-normal">
                    Secretaria Municipal do Respeito às Políticas para as
                    Mulheres
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarMenu>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const hasSubmenu = item.items && item.items.length > 0;
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + "/") && item.href !== "/");

              if (hasSubmenu) {
                const isChildActive = item.items?.some((sub) =>
                  pathname.startsWith(sub.href),
                );
                return (
                  <Collapsible
                    key={item.label}
                    asChild
                    defaultOpen={isChildActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={isActive || isChildActive}
                          className={cn(
                            (isActive || isChildActive) &&
                              "bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold",
                          )}
                        >
                          <Icon className="size-5" />
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === subItem.href}
                                  className={cn(
                                    pathname === subItem.href &&
                                      "text-blue-600 dark:text-blue-400 font-medium",
                                  )}
                                >
                                  <Link
                                    href={subItem.href}
                                    className="flex items-center gap-2"
                                  >
                                    {SubIcon && <SubIcon className="size-4" />}
                                    <span>{subItem.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className={cn(
                      isActive &&
                        "bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold",
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto pt-4">
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Manual do Usuário"
                isActive={pathname.startsWith("/manual")}
                className={cn(
                  pathname.startsWith("/manual") &&
                    "bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold",
                )}
              >
                <Link href="/manual">
                  <Book className="size-5" />
                  <span>Manual do Usuário</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Configurações"
                isActive={pathname.startsWith("/configuracoes")}
                className={cn(
                  pathname.startsWith("/configuracoes") &&
                    "bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold",
                )}
              >
                <Link href="/configuracoes">
                  <Settings className="size-5" />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <form action={handleLogout} className="w-full">
                <SidebarMenuButton type="submit" tooltip="Sair">
                  <LogOut className="size-5" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </form>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="mt-2 text-center pb-2 opacity-30">
          <span className="text-[10px] font-mono">v1.1</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </ShadcnSidebar>
  );
}
