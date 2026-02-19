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
      color: 'hover:bg-primary/10 hover:border-primary/50 hover:text-primary',
      onClick: onRefresh,
      disabled: cargando,
    },
    {
      icon: Download,
      label: 'Exportar',
      descripcion: 'Descargar CSV',
      color: 'hover:bg-chart-1/10 hover:border-chart-1/50 hover:text-chart-1',
      onClick: onExport,
    },
    {
      icon: Filter,
      label: 'Filtrar',
      descripcion: filtrosActivos ? 'Filtros activos' : 'Aplicar filtros',
      color: filtrosActivos
        ? 'bg-chart-2/10 border-chart-2/50 text-chart-2'
        : 'hover:bg-chart-2/10 hover:border-chart-2/50 hover:text-chart-2',
      onClick: onFilter,
    },
  ];

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex justify-center gap-3 max-w-2xl mx-auto">
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
