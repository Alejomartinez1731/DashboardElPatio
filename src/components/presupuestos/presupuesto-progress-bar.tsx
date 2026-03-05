/**
 * Componente de barra de progreso para presupuesto por categoría
 * Muestra el presupuesto vs gasto actual con colores según el estado
 */

import { AlertTriangle } from 'lucide-react';
import { formatearMoneda } from '@/lib/formatters';
import type { EstadoAlerta } from '@/lib/schemas';

interface PresupuestoProgressBarProps {
  presupuesto: number;
  gastado: number;
  mostrarValores?: boolean;
  mostrarAlerta?: boolean;
  className?: string;
}

export function PresupuestoProgressBar({
  presupuesto,
  gastado,
  mostrarValores = true,
  mostrarAlerta = true,
  className = '',
}: PresupuestoProgressBarProps) {
  // Calcular porcentaje
  const porcentaje = presupuesto > 0 ? (gastado / presupuesto) * 100 : 0;
  const porcentajeClamped = Math.min(100, Math.max(0, porcentaje));
  const diferencia = presupuesto - gastado;

  // Determinar estado
  let estado: EstadoAlerta = 'ok';
  if (porcentaje >= 100) estado = 'excedido';
  else if (porcentaje >= 80) estado = 'peligro';
  else if (porcentaje >= 60) estado = 'advertencia';

  // Colores según estado
  const colores = {
    ok: {
      bg: 'bg-green-500',
      text: 'text-green-500',
      bgLight: 'bg-green-50 dark:bg-green-950/30',
    },
    advertencia: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-500',
      bgLight: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    peligro: {
      bg: 'bg-orange-500',
      text: 'text-orange-500',
      bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    },
    excedido: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      bgLight: 'bg-red-50 dark:bg-red-950/30',
    },
  };

  const color = colores[estado];

  // Mensaje de alerta
  const getMensajeAlerta = (): string | null => {
    if (porcentaje >= 100) return `Has excedido el presupuesto por ${formatearMoneda(Math.abs(diferencia))}`;
    if (porcentaje >= 80) return 'Estás cerca del límite (80%+)';
    if (porcentaje >= 60) return 'Has usado más del 60%';
    return null;
  };

  return (
    <div className={className}>
      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className={`font-semibold ${estado !== 'ok' ? color.text : ''}`}>
            {porcentajeClamped.toFixed(1)}%
          </span>
        </div>

        <div className="h-3 bg-muted rounded-full overflow-hidden relative">
          <div
            className={`h-full ${color.bg} transition-all duration-500 ease-out`}
            style={{ width: `${porcentajeClamped}%` }}
          />
        </div>

        {mostrarValores && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatearMoneda(gastado)}</span>
            <span>de {formatearMoneda(presupuesto)}</span>
          </div>
        )}
      </div>

      {/* Alerta */}
      {mostrarAlerta && estado !== 'ok' && getMensajeAlerta() && (
        <div className={`flex items-center gap-2 mt-3 p-2 rounded-lg ${color.bgLight}`}>
          <AlertTriangle className={`w-4 h-4 ${color.text} flex-shrink-0`} />
          <span className={`text-sm font-medium ${color.text}`}>
            {getMensajeAlerta()}
          </span>
        </div>
      )}
    </div>
  );
}
