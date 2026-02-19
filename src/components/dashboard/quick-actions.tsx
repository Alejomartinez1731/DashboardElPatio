'use client';

import { Card } from '@/components/ui/card';
import { Download, RefreshCw, Filter, Calendar, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  cargando?: boolean;
  filtrosActivos?: boolean;
}

export function QuickActions({
  onRefresh,
  onExport,
  onFilter,
  cargando = false,
  filtrosActivos = false
}: QuickActionsProps) {
  const acciones = [
    {
      icon: RefreshCw,
      label: 'Actualizar',
      descripcion: 'Recargar datos',
      color: 'hover:bg-[#f59e0b]/10 hover:border-[#f59e0b]/50 hover:text-[#f59e0b]',
      onClick: onRefresh,
      disabled: cargando,
    },
    {
      icon: Download,
      label: 'Exportar',
      descripcion: 'Descargar CSV',
      color: 'hover:bg-[#10b981]/10 hover:border-[#10b981]/50 hover:text-[#10b981]',
      onClick: onExport,
    },
    {
      icon: Filter,
      label: 'Filtrar',
      descripcion: filtrosActivos ? 'Filtros activos' : 'Aplicar filtros',
      color: filtrosActivos
        ? 'bg-[#3b82f6]/10 border-[#3b82f6]/50 text-[#3b82f6]'
        : 'hover:bg-[#3b82f6]/10 hover:border-[#3b82f6]/50 hover:text-[#3b82f6]',
      onClick: onFilter,
    },
    {
      icon: Calendar,
      label: 'Periodo',
      descripcion: 'Seleccionar rango',
      color: 'hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]/50 hover:text-[#8b5cf6]',
      onClick: onFilter,
    },
  ];

  return (
    <Card className="p-4 bg-card border-border">
      <div className={`grid gap-3 ${acciones.filter(a => a.onClick).length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-2'}`}>
        {acciones.filter(a => a.onClick).map((accion) => {
          const Icon = accion.icon;
          return (
            <button
              key={accion.label}
              onClick={accion.onClick}
              disabled={accion.disabled}
              className={`
                group flex flex-col items-center gap-2 p-4
                bg-muted border border-border rounded-lg
                transition-all duration-200
                ${accion.color}
                ${accion.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${!accion.disabled ? 'group-hover:scale-110' : ''}
              `}>
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-current transition-colors" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors">
                {accion.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
