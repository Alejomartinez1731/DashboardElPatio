'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatearFechaHora } from '@/lib/formatters';
import { useState, useEffect } from 'react';

export function Header() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [cargando, setCargando] = useState(false);

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
    <header className="h-16 bg-[#0d1117] border-b border-[#1e293b] flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Panel de Control
        </h2>
        <p className="text-xs text-[#64748b]">
          Vila-seca, Tarragona
        </p>
      </div>

      <div className="flex items-center gap-6">
        {/* Fecha y hora */}
        <div className="text-right">
          <p className="text-sm text-[#94a3b8]">Última actualización</p>
          <p className="text-xs text-[#64748b] font-mono">
            {formatearFechaHora(fechaActual)}
          </p>
        </div>

        {/* Botón de refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={cargando}
          className="border-[#1e293b] hover:bg-[#1a2234] hover:text-white text-[#94a3b8]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
    </header>
  );
}
