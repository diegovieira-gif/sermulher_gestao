"use client";

import { LogOut, UserCog, ChevronDown } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header({
  title,
  userName = "Usuário",
  userRole,
  userEmail,
}: HeaderProps) {
  const handleLogout = async () => {
    await logout();
  };

  const initials = getInitials(userName);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground truncate">
          {title}
        </h2>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="group h-auto gap-3 rounded-full border border-transparent py-1.5 pl-3 pr-2 transition-all hover:border-border hover:bg-muted/60 hover:shadow-sm data-[state=open]:border-border data-[state=open]:bg-muted/60"
            >
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-foreground">
                  {userName}
                </p>
                {userRole && (
                  <p className="text-xs leading-tight text-muted-foreground">
                    {userRole}
                  </p>
                )}
              </div>

              {/* Avatar com anel em gradiente + indicador online */}
              <div className="relative">
                <div className="rounded-full bg-gradient-to-br from-primary via-primary/70 to-fuchsia-500 p-[2px] shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-sm font-bold text-primary">
                    {initials}
                  </div>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
              </div>

              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 p-0">
            {/* Cabeçalho do menu */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3">
              <div className="rounded-full bg-gradient-to-br from-primary via-primary/70 to-fuchsia-500 p-[2px] shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-card text-base font-bold text-primary">
                  {initials}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {userName}
                </p>
                {userEmail ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </p>
                ) : null}
                {userRole && (
                  <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {userRole}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenuSeparator className="my-0" />

            <div className="p-1">
              <DropdownMenuItem asChild className="cursor-pointer rounded-md">
                <Link href="/perfil">
                  <UserCog className="mr-2 h-4 w-4" />
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-md text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
