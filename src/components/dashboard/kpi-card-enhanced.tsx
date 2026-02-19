'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Euro, DollarSign, Activity } from 'lucide-react';
import { formatearMoneda, formatearNumero, formatearVariacion } from '@/lib/formatters';
import { colorVariacion } from '@/lib/formatters';

interface KPICardEnhancedProps {
  titulo: string;
  valor: number;
  tipo?: 'moneda' | 'numero';
  variacion?: number;
  icono?: 'shopping' | 'euro' | 'dollar' | 'activity' | 'trending-up' | 'trending-down';
  progreso?: number; // 0-100
  subtitulo?: string;
  destino?: string;
}

const ICONS = {
  shopping: ShoppingCart,
  euro: Euro,
  dollar: DollarSign,
  activity: Activity,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
};

export function KPICardEnhanced({
  titulo,
  valor,
  tipo = 'moneda',
  variacion,
  icono,
  progreso,
  subtitulo,
  destino
}: KPICardEnhancedProps) {
  const valorFormateado = tipo === 'moneda' ? formatearMoneda(valor) : formatearNumero(valor);

  const esPositivo = variacion && variacion > 0;
  const esNegativo = variacion && variacion < 0;

  const IconoComponent = icono ? ICONS[icono] : undefined;
  const TrendIcon = variacion === undefined ? Minus : esPositivo ? TrendingUp : TrendingDown;

  // Color basado en variación
  const trendColor = variacion !== undefined ? colorVariacion(variacion) : '#94A3B8';

  return (
    <Card className="group relative p-6 bg-gradient-to-br from-background to-card border-border hover:border-primary/50 transition-all duration-300 overflow-hidden">
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full"></div>

      {/* Círculos decorativos */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-chart-2/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative">
        {/* Header con icono y título */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{titulo}</p>
            <p className="text-3xl font-bold text-white font-mono tracking-tight">
              {valorFormateado}
            </p>
            {subtitulo && (
              <p className="text-xs text-muted-foreground mt-1">{subtitulo}</p>
            )}
          </div>

          {IconoComponent && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <IconoComponent className="w-6 h-6" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Variación */}
        {variacion !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold"
              style={{
                backgroundColor: `${trendColor}15`,
                color: trendColor
              }}
            >
              <TrendIcon className="w-3 h-3" strokeWidth={2.5} />
              <span>{formatearVariacion(Math.abs(variacion))}</span>
            </div>
            <span className="text-xs text-muted-foreground">vs periodo anterior</span>
          </div>
        )}

        {/* Barra de progreso */}
        {progreso !== undefined && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span>{progreso.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progreso, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Destino (opcional) */}
        {destino && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="text-primary">Destino:</span> {destino}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
