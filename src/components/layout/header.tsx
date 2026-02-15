'use client';

import { RefreshCw, Bell, Search, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatearFechaHora } from '@/lib/formatters';
import { useState, useEffect } from 'react';

export function Header() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState(3);

  // Actualizar reloj cada segundo
  useEffect(() => {
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
    <header className="h-16 bg-[#0d1117]/80 backdrop-blur-xl border-b border-[#1e293b] flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-1 h-8 bg-gradient-to-b from-[#f59e0b] to-[#f59e0b]/30 rounded-full"></div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Panel de Control
          </h2>
          <p className="text-xs text-[#64748b] flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></span>
            Vila-seca, Tarragona
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Barra de búsqueda */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border border-[#1e293b] rounded-lg hover:border-[#f59e0b]/50 transition-colors cursor-pointer group">
          <Search className="w-4 h-4 text-[#64748b] group-hover:text-[#f59e0b] transition-colors" />
          <span className="text-sm text-[#64748b]">Buscar...</span>
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1e293b] rounded text-xs text-[#64748b] font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Fecha y hora */}
        <div className="hidden sm:block text-right px-3 py-1.5 bg-[#0d1117] border border-[#1e293b] rounded-lg hover:border-[#f59e0b]/30 transition-colors">
          <p className="text-xs text-[#64748b]">Última actualización</p>
          <p className="text-xs text-[#f59e0b] font-mono font-medium">
            {formatearFechaHora(fechaActual)}
          </p>
        </div>

        {/* Separador */}
        <div className="hidden lg:block w-px h-8 bg-[#1e293b]"></div>

        {/* Notificaciones */}
        <button className="relative p-2 text-[#94a3b8] hover:text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded-lg transition-all duration-200">
          <Bell className="w-5 h-5" />
          {notificaciones > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full animate-pulse"></span>
          )}
        </button>

        {/* Botón de refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={cargando}
          className="border-[#1e293b] hover:bg-[#f59e0b]/10 hover:border-[#f59e0b]/50 hover:text-[#f59e0b] text-[#94a3b8] transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>

        {/* Avatar */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1a2234] transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] rounded-lg flex items-center justify-center text-white text-sm font-semibold">
            EP
          </div>
        </button>
      </div>
    </header>
  );
}
