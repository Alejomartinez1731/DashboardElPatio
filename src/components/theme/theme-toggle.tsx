'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/theme-context';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
      <button
        onClick={() => setTheme('light')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          theme === 'light' || (theme === 'system' && effectiveTheme === 'light')
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title="Tema claro"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          theme === 'system'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title="Tema del sistema"
      >
        <Monitor className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          'p-2 rounded-md transition-all duration-200',
          theme === 'dark' || (theme === 'system' && effectiveTheme === 'dark')
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        title="Tema oscuro"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
