/**
 * Tarjeta de alerta para presupuestos excedidos o cerca del límite
 * Se muestra en el dashboard cuando una categoría supera el umbral
 */

import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatearMoneda } from '@/lib/formatters';
import { CATEGORIAS_INFO, type CategoriaProducto } from '@/types';
import type { EstadoAlerta } from '@/lib/schemas';

interface PresupuestoAlert {
  id: string;
  categoria: CategoriaProducto;
  presupuesto: number;
  gastado: number;
  porcentaje: number;
  diferencia: number;
  estado: EstadoAlerta;
}

interface PresupuestoAlertCardProps {
  alertas: PresupuestoAlert[];
  onVerDetalles?: () => void;
  className?: string;
}

export function PresupuestoAlertCard({ alertas, onVerDetalles, className = '' }: PresupuestoAlertCardProps) {
  if (alertas.length === 0) return null;

  // Ordenar por severidad (excedido > peligro > advertencia > ok)
  const severidadOrder = { excedido: 0, peligro: 1, advertencia: 2, ok: 3 };
  const alertasOrdenadas = [...alertas].sort((a, b) => severidadOrder[a.estado] - severidadOrder[b.estado]);

  // Obtener color según estado
  const getEstilos = (estado: EstadoAlerta) => {
    switch (estado) {
      case 'excedido':
        return {
          border: 'border-red-500',
          bg: 'bg-red-50 dark:bg-red-950/20',
          text: 'text-red-500',
          icon: 'bg-red-100 dark:bg-red-950/30',
        };
      case 'peligro':
        return {
          border: 'border-orange-500',
          bg: 'bg-orange-50 dark:bg-orange-950/20',
          text: 'text-orange-500',
          icon: 'bg-orange-100 dark:bg-orange-950/30',
        };
      case 'advertencia':
        return {
          border: 'border-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-950/20',
          text: 'text-yellow-500',
          icon: 'bg-yellow-100 dark:bg-yellow-950/30',
        };
      default:
        return {
          border: 'border-border',
          bg: 'bg-background',
          text: 'text-foreground',
          icon: 'bg-muted',
        };
    }
  };

  // Obtener mensaje según estado
  const getMensaje = (estado: EstadoAlerta, porcentaje: number): string => {
    switch (estado) {
      case 'excedido':
        return `Has excedido el presupuesto`;
      case 'peligro':
        return `Al ${porcentaje.toFixed(0)}% del presupuesto`;
      case 'advertencia':
        return `Has usado más del 60%`;
      default:
        return '';
    }
  };

  return (
    <Card className={`border-l-4 ${alertasOrdenadas[0].estado === 'excedido' ? 'border-l-red-500' : 'border-l-orange-500'} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className={getEstilos(alertasOrdenadas[0].estado).text} />
          Alertas de Presupuesto
          <span className={`ml-auto text-sm font-semibold ${getEstilos(alertasOrdenadas[0].estado).text}`}>
            {alertas.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {alertasOrdenadas.slice(0, 3).map((alerta) => {
          const estilos = getEstilos(alerta.estado);
          const categoriaInfo = CATEGORIAS_INFO[alerta.categoria];

          return (
            <div
              key={alerta.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${estilos.bg} border ${estilos.border}`}
            >
              {/* Icono de categoría */}
              <div className={`p-2 rounded-lg ${estilos.icon}`}>
                <span className="text-xl">{categoriaInfo?.icono || '📦'}</span>
              </div>

              {/* Información */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{categoriaInfo?.nombre || alerta.categoria}</p>
                  <p className={`text-sm font-semibold ${estilos.text}`}>{alerta.porcentaje.toFixed(0)}%</p>
                </div>
                <p className="text-xs text-muted-foreground">{getMensaje(alerta.estado, alerta.porcentaje)}</p>
              </div>

              {/* Diferencia */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Diferencia</p>
                <p className={`text-sm font-semibold ${alerta.diferencia >= 0 ? 'text-green-500' : estilos.text}`}>
                  {alerta.diferencia >= 0 ? '+' : '-'}
                  {formatearMoneda(Math.abs(alerta.diferencia))}
                </p>
              </div>
            </div>
          );
        })}

        {/* Mostrar más */}
        {alertas.length > 3 && (
          <button
            onClick={onVerDetalles}
            className="w-full text-center text-sm text-primary hover:underline pt-2"
          >
            Ver {alertas.length - 3} alerta{alertas.length - 3 > 1 ? 's' : ''} más
          </button>
        )}
      </CardContent>
    </Card>
  );
}
