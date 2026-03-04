'use client';

import { Card } from '@/components/ui/card';
import { Download, RefreshCw, Filter, Calendar, Printer, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  cargando?: boolean;
  exportando?: boolean;
  filtrosActivos?: boolean;
}

interface Accion {
  icon: LucideIcon;
  label: string;
  descripcion: string;
  color: string;
  onClick?: (() => void) | undefined;
  disabled: boolean;
  loading: boolean;
  testid?: string;
}

export function QuickActions({
  onRefresh,
  onExport,
  onFilter,
  cargando = false,
  exportando = false,
  filtrosActivos = false
}: QuickActionsProps) {
  const acciones = [
    {
      icon: RefreshCw,
      label: cargando ? 'Actualizando...' : 'Actualizar',
      descripcion: 'Recargar datos',
      color: 'hover:bg-primary/10 hover:border-primary/50 hover:text-primary',
      onClick: onRefresh,
      disabled: cargando || exportando,
      loading: cargando,
    },
    {
      icon: Download,
      label: exportando ? 'Exportando...' : 'Exportar',
      descripcion: 'Descargar Excel',
      color: 'hover:bg-chart-1/10 hover:border-chart-1/50 hover:text-chart-1',
      onClick: onExport,
      disabled: exportando || cargando,
      loading: exportando,
      testid: 'export-button',
    },
    {
      icon: Filter,
      label: 'Filtrar',
      descripcion: filtrosActivos ? 'Filtros activos' : 'Aplicar filtros',
      color: filtrosActivos
        ? 'bg-chart-2/10 border-chart-2/50 text-chart-2'
        : 'hover:bg-chart-2/10 hover:border-chart-2/50 hover:text-chart-2',
      onClick: onFilter,
      disabled: exportando,
    },
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="grid grid-cols-3 gap-6">
        {acciones.filter(a => a.onClick).map((accion) => {
          const Icon = accion.icon;
          return (
            <button
              key={accion.label}
              onClick={accion.onClick}
              disabled={accion.disabled}
              data-testid={accion.testid}
              className={`
                group flex flex-col items-center gap-2 p-4
                bg-muted border border-border rounded-lg
                transition-all duration-200
                ${accion.color}
                ${accion.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}
              `}
              title={accion.descripcion}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                transition-all duration-200 relative
                ${!accion.disabled ? 'group-hover:scale-110' : ''}
              `}>
                {accion.loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-current" />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-current transition-colors" />
                )}
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
