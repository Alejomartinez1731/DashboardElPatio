'use client';

import { RefreshCw, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatearFechaHora } from '@/lib/formatters';
import { useState, useEffect } from 'react';

export function Header() {
  const [fechaActual, setFechaActual] = useState<Date | null>(null);
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState(3);
  const [mounted, setMounted] = useState(false);

  // Evitar error de hidratación - solo ejecutar en el cliente
  useEffect(() => {
    setMounted(true);
    setFechaActual(new Date());

    const interval = setInterval(() => {
      setFechaActual(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setCargando(true);
    window.location.reload();
  };

  return (
    <header className="h-16 bg-muted/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-1 h-8 bg-gradient-to-b from-[#f59e0b] to-[#f59e0b]/30 rounded-full"></div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Panel de Control
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
            Vila-seca, Tarragona
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Fecha y hora */}
        {mounted && (
          <div className="hidden sm:block text-right px-3 py-1.5 bg-muted border border-border rounded-lg hover:border-primary/30 transition-colors">
            <p className="text-xs text-muted-foreground">Última actualización</p>
            <p className="text-xs text-primary font-mono font-medium">
              {fechaActual ? formatearFechaHora(fechaActual) : '--:--'}
            </p>
          </div>
        )}

        {/* Separador */}
        <div className="hidden lg:block w-px h-8 bg-card"></div>

        {/* Notificaciones */}
        <button className="relative p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200">
          <Bell className="w-5 h-5" />
          {notificaciones > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
          )}
        </button>

        {/* Botón de refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={cargando}
          className="border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary text-muted-foreground transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>

        {/* Avatar */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-amber-400 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
            EP
          </div>
        </button>
      </div>
    </header>
  );
}
