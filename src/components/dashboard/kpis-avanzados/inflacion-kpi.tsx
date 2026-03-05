/**
 * KPI de Índice de Inflación - Mejorado
 * Muestra datos específicos y accionables sobre variación de precios
 */

import { TrendingUp, TrendingDown, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

// Calcular impacto mensual estimado de la inflación
function calcularImpactoMensual(productos: ProductoInflacion[]): {
  impacto_total_eur: number;
  impacto_promedio_eur: number;
} {
  if (productos.length === 0) return { impacto_total_eur: 0, impacto_promedio_eur: 0 };

  const impactoTotal = productos.reduce((sum, prod) => {
    const diferencia = prod.precio_actual - prod.precio_anterior;
    // Estimar impacto mensual (asumimos 1 compra por mes como promedio)
    return sum + diferencia;
  }, 0);

  return {
    impacto_total_eur: Math.round(impactoTotal * 100) / 100,
    impacto_promedio_eur: Math.round((impactoTotal / productos.length) * 100) / 100,
  };
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
      ? { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-500/30' }
      : variacion_promedio > 2
        ? { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-500/30' }
        : variacion_promedio < -2
          ? { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-500/30' }
          : { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-500/30' };

  const impacto = calcularImpactoMensual(productos_top_inflacion);
  const productosCriticos = productos_top_inflacion.filter(p => p.variacion_porcentaje > 10);
  const top5Productos = productos_top_inflacion.slice(0, 5);

  return (
    <Card className={`${className} ${estilos.border} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Índice de Inflación
          </CardTitle>
          {variacion_promedio > 5 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-950/30">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs font-medium text-red-500">Alta</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métrica principal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Inflación promedio</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${estilos.color}`}>
                {variacion_promedio > 0 ? '+' : ''}{variacion_promedio.toFixed(1)}%
              </span>
              {impacto.impacto_total_eur !== 0 && (
                <span className={`text-sm font-medium ${estilos.color}`}>
                  ({impacto.impacto_total_eur >= 0 ? '+' : ''}{formatearMoneda(impacto.impacto_total_eur)}/mes)
                </span>
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${estilos.bg}`}>
            {variacion_promedio > 0 ? (
              <TrendingUp className={`w-5 h-5 ${estilos.color}`} />
            ) : (
              <TrendingDown className={`w-5 h-5 ${estilos.color}`} />
            )}
          </div>
        </div>

        {/* Alerta de productos críticos */}
        {productosCriticos.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">
                  {productosCriticos.length} producto{productosCriticos.length > 1 ? 's' : ''} con más de 10% de aumento
                </p>
                {productosCriticos.length <= 3 && (
                  <p className="text-xs text-red-400 mt-1">
                    {productosCriticos.map(p => p.producto).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top productos con variación detallada */}
        {top5Productos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Productos con mayor variación</p>
              <p className="text-xs text-muted-foreground">
                {productos_analizados} analizados • {productos_con_aumento} con aumento
              </p>
            </div>

            <div className="space-y-2">
              {top5Productos.map((prod, idx) => {
                const diferenciaEur = prod.precio_actual - prod.precio_anterior;
                const esCritico = prod.variacion_porcentaje > 10;

                return (
                  <div
                  key={idx}
                    className={`p-2 rounded-lg border ${
                      esCritico
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-500/30'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{prod.producto}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            {formatearMoneda(prod.precio_anterior)} → {formatearMoneda(prod.precio_actual)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`flex items-center gap-1 text-sm font-semibold ${
                          prod.variacion_porcentaje > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {prod.variacion_porcentaje > 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {prod.variacion_porcentaje > 0 ? '+' : ''}{prod.variacion_porcentaje.toFixed(1)}%
                        </div>
                        <p className={`text-xs font-medium ${
                          diferenciaEur > 0 ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {diferenciaEur > 0 ? '+' : ''}{formatearMoneda(diferenciaEur)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sin datos suficientes */}
        {productos_top_inflacion.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Se necesitan más compras para calcular inflación</p>
            <p className="text-xs mt-1">Mínimo 3 compras por producto</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
