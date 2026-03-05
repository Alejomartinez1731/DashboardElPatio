/**
 * KPI de Índice de Inflación
 * Muestra la variación porcentual de precios de productos recurrentes
 */

import { TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatearMoneda } from '@/lib/formatters';

interface ProductoInflacion {
  producto: string;
  variacion_porcentaje: number;
  precio_actual: number;
  precio_anterior: number;
}

interface InflacionKPIProps {
  variacion_promedio: number;
  productos_con_aumento: number;
  productos_analizados: number;
  productos_top_inflacion: ProductoInflacion[];
  className?: string;
}

export function InflacionKPI({
  variacion_promedio,
  productos_con_aumento,
  productos_analizados,
  productos_top_inflacion,
  className = '',
}: InflacionKPIProps) {
  const estilos =
    variacion_promedio > 5
      ? { color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-950/30' }
      : variacion_promedio > 2
        ? { color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-950/30' }
        : variacion_promedio < -2
          ? { color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-950/30' }
          : { color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-950/30' };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Índice de Inflación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Variación promedio</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${estilos.color}`}>
                  {variacion_promedio > 0 ? '+' : ''}{variacion_promedio.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${estilos.bg}`}>
              <DollarSign className={`w-5 h-5 ${estilos.color}`} />
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Productos analizados</span>
              <span className="font-medium">{productos_analizados}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Con aumento significativo</span>
              <span className={productos_con_aumento > 0 ? 'text-red-500 font-semibold' : ''}>
                {productos_con_aumento}
              </span>
            </div>
          </div>

          {/* Top 3 productos con mayor inflación */}
          {productos_top_inflacion.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Top aumentos</p>
              <div className="space-y-1">
                {productos_top_inflacion.slice(0, 3).map((prod, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="truncate flex-1">{prod.producto}</span>
                    <span className="text-red-500 font-medium ml-2">
                      +{prod.variacion_porcentaje}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
