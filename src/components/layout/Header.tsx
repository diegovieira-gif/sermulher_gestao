'use client';

import { User } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">admin@sermulher.org</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
