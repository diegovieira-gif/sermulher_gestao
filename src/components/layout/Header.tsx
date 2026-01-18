'use client';

import { User, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { logout } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [userName, setUserName] = useState('Usuário');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Pega as informações do usuário dos cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const name = getCookie('user_name');
    const role = getCookie('user_role');
    
    if (name) setUserName(decodeURIComponent(name));
    if (role) setUserRole(decodeURIComponent(role));
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 left-64 right-0 z-30 bg-white shadow-md dark:bg-slate-800">
      <div className="flex h-16 items-center justify-between px-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h2>

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
      </div>
    </header>
  );
}
