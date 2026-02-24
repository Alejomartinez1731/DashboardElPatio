'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Store } from 'lucide-react';
import { formatearMoneda, formatearVariacion, colorVariacion } from '@/lib/formatters';
import { calcularComparativaMensual, ComparativaMensual, COLORES_TIENDA } from '@/lib/data-utils';
import { Compra } from '@/types';

interface MonthlyComparisonProps {
  compras: Compra[];
}

export function MonthlyComparison({ compras }: MonthlyComparisonProps) {
  const comparativa = calcularComparativaMensual(compras);

  if (!comparativa) {
    return (
      <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No hay datos suficientes para comparar con el mes anterior</p>
        </div>
      </Card>
    );
  }

  const { gastoActual, gastoMesAnterior, variacionPorcentaje, variacionImporte, tendencia, mesActualNombre, mesAnteriorNombre, mesActualAnio, mesAnteriorAnio, breakdownPorTienda } = comparativa;

  const TrendIcon = tendencia === 'subida' ? TrendingUp : tendencia === 'bajada' ? TrendingDown : Minus;
  const trendColor = colorVariacion(variacionPorcentaje);
  const esSubida = tendencia === 'subida';

  // Ordenar tiendas por gasto actual (descendente)
  const tiendasOrdenadas = Object.entries(breakdownPorTienda)
    .sort(([, a], [, b]) => b.actual - a.actual)
    .slice(0, 5); // Top 5 tiendas

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Tarjeta principal de comparativa */}
      <Card className="lg:col-span-2 p-6 bg-gradient-to-br from-background to-card border-border hover:border-primary/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Comparativa Mensual
            </p>
            <p className="text-2xl font-bold text-white">
              {mesActualNombre} {mesActualAnio} vs {mesAnteriorNombre} {mesAnteriorAnio}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: `${trendColor}15`,
            }}
          >
            <TrendIcon className="w-6 h-6" strokeWidth={2} style={{ color: trendColor }} />
          </div>
        </div>

        {/* Valores de gasto */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{mesActualNombre} {mesActualAnio}</p>
            <p className="text-xl font-bold text-white font-mono">{formatearMoneda(gastoActual)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{mesAnteriorNombre} {mesAnteriorAnio}</p>
            <p className="text-xl font-bold text-white font-mono">{formatearMoneda(gastoMesAnterior)}</p>
          </div>
        </div>

        {/* Variación */}
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold"
            style={{
              backgroundColor: `${trendColor}15`,
              color: trendColor,
            }}
          >
            <TrendIcon className="w-4 h-4" strokeWidth={2.5} />
            <span>{formatearVariacion(variacionPorcentaje)}</span>
          </div>
          <div className="text-sm">
            <span className={esSubida ? 'text-red-400' : 'text-green-400'}>
              {esSubida ? '+' : ''}
              {formatearMoneda(variacionImporte)}
            </span>
            <span className="text-muted-foreground ml-1">respecto al mes anterior</span>
          </div>
        </div>
      </Card>

      {/* Breakdown por tienda */}
      <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-primary" />
          <p className="text-sm font-semibold text-white">Por Tienda</p>
        </div>

        <div className="space-y-3">
          {tiendasOrdenadas.map(([tienda, datos]) => {
            const tiendaColor = COLORES_TIENDA[tienda] || '#64748b';
            const esTiendaSubida = datos.variacion > 1;
            const tiendaTrendColor = colorVariacion(datos.variacion);

            return (
              <div key={tienda} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tiendaColor }}
                    />
                    <span className="text-white font-medium">{tienda}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{formatearMoneda(datos.anterior)}</span>
                    <span className="text-white font-medium">{formatearMoneda(datos.actual)}</span>
                  </div>
                </div>
                {/* Barra de gasto */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min((datos.actual / gastoActual) * 100, 100)}%`,
                        backgroundColor: tiendaColor,
                      }}
                    />
                  </div>
                  {/* Indicador de variación */}
                  {datos.variacion !== 0 && (
                    <div
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                      style={{
                        backgroundColor: `${tiendaTrendColor}15`,
                        color: tiendaTrendColor,
                      }}
                    >
                      {esTiendaSubida ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      <span>{Math.abs(datos.variacion).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total breakdown */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total {mesActualNombre}</span>
            <span className="text-white font-semibold">{formatearMoneda(gastoActual)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
