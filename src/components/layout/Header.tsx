"use client";

import { User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { } from "react";

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
}

export function Header({ title, userName = "Usuário", userRole }: HeaderProps) {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 sm:px-6 transition-all">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </h2>
      </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {userName}
                  </p>
                  {userRole && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {userRole}
                    </p>
                  )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                  <User className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </header>
  );
}
