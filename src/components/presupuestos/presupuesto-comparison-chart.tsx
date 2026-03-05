/**
 * Gráfico de comparación de presupuesto vs gasto por categoría
 * Muestra barras horizontales comparativas
 */

import { formatearMoneda } from '@/lib/formatters';
import { CATEGORIAS_INFO, type CategoriaProducto } from '@/types';
import type { PresupuestoVsGasto } from '@/lib/schemas';

interface PresupuestoComparisonChartProps {
  datos: PresupuestoVsGasto[];
  className?: string;
}

export function PresupuestoComparisonChart({ datos, className = '' }: PresupuestoComparisonChartProps) {
  // Ordenar por porcentaje de uso (mayor a menor)
  const datosOrdenados = [...datos].sort((a, b) => b.porcentaje_usado - a.porcentaje_usado);

  // Encontrar el valor máximo para escalar las barras
  const maxValor = Math.max(
    ...datosOrdenados.map(d => Math.max(d.presupuesto, d.gasto_actual)),
    1 // Evitar división por cero
  );

  // Obtener color según porcentaje
  const getColorBarra = (porcentaje: number): string => {
    if (porcentaje >= 100) return 'bg-red-500';
    if (porcentaje >= 80) return 'bg-orange-500';
    if (porcentaje >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Comparativa por Categoría</h3>

      <div className="space-y-4">
        {datosOrdenados.map((dato) => {
          const categoriaInfo = CATEGORIAS_INFO[dato.categoria as CategoriaProducto];
          const porcentaje = dato.porcentaje_usado;
          const presupuestoWidth = (dato.presupuesto / maxValor) * 100;
          const gastoWidth = (dato.gasto_actual / maxValor) * 100;

          return (
            <div key={dato.id} className="space-y-2">
              {/* Header de categoría */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{categoriaInfo?.icono || '📦'}</span>
                  <span className="font-medium">{categoriaInfo?.nombre || dato.categoria}</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    porcentaje >= 80 ? 'text-red-500' : porcentaje >= 60 ? 'text-yellow-500' : 'text-muted-foreground'
                  }`}
                >
                  {porcentaje.toFixed(1)}%
                </span>
              </div>

              {/* Barras comparativas */}
              <div className="space-y-1">
                {/* Barra de presupuesto */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-muted-foreground">Presupuesto</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 opacity-50"
                      style={{ width: `${presupuestoWidth}%` }}
                    />
                  </div>
                  <span className="w-20 text-right">{formatearMoneda(dato.presupuesto)}</span>
                </div>

                {/* Barra de gasto */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-muted-foreground">Gastado</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getColorBarra(porcentaje)}`}
                      style={{ width: `${gastoWidth}%` }}
                    />
                  </div>
                  <span className={`w-20 text-right ${porcentaje >= 100 ? 'text-red-500 font-semibold' : ''}`}>
                    {formatearMoneda(dato.gasto_actual)}
                  </span>
                </div>
              </div>

              {/* Diferencia */}
              <div className="text-xs text-right">
                <span className={dato.diferencia >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {dato.diferencia >= 0 ? '+' : '-'}
                  {formatearMoneda(Math.abs(dato.diferencia))}
                </span>
                <span className="text-muted-foreground ml-1">
                  {dato.diferencia >= 0 ? 'disponible' : 'excedido'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
