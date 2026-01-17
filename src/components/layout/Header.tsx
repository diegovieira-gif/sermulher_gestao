'use client';

import { User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 left-64 right-0 z-30 bg-white shadow-md dark:bg-slate-800">
      <div className="flex h-16 items-center justify-between px-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h2>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Admin User</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">admin@sermulher.org</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
