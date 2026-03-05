/**
 * KPI de Tasa de Compras
 * Muestra número de compras por día/semana/mes
 */

import { ShoppingCart, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Minus as MinusIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface TasaComprasKPIProps {
  compras_por_dia: number;
  compras_por_semana: number;
  compras_por_mes: number;
  tendencia: 'alcista' | 'bajista' | 'estable';
  variacion_semana_anterior: number;
  className?: string;
}

export function TasaComprasKPI({
  compras_por_dia,
  compras_por_semana,
  compras_por_mes,
  tendencia,
  variacion_semana_anterior,
  className = '',
}: TasaComprasKPIProps) {
  const getEstilosTendencia = () => {
    switch (tendencia) {
      case 'alcista':
        return {
          icono: TrendingUpIcon,
          color: 'text-green-500',
          bg: 'bg-green-100 dark:bg-green-950/30',
          label: 'Alcista',
        };
      case 'bajista':
        return {
          icono: TrendingDownIcon,
          color: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-950/30',
          label: 'Bajista',
        };
      default:
        return {
          icono: MinusIcon,
          color: 'text-yellow-500',
          bg: 'bg-yellow-100 dark:bg-yellow-950/30',
          label: 'Estable',
        };
    }
  };

  const estilosTendencia = getEstilosTendencia();
  const IconoTendencia = estilosTendencia.icono;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Tasa de Compras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Tendencia */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tendencia semanal</p>
              <div className="flex items-center gap-2 mt-1">
                <IconoTendencia className={`w-4 h-4 ${estilosTendencia.color}`} />
                <span className={`text-sm font-medium ${estilosTendencia.color}`}>
                  {estilosTendencia.label}
                </span>
                <span className={`text-xs ${variacion_semana_anterior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ({variacion_semana_anterior >= 0 ? '+' : ''}{variacion_semana_anterior.toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className={`p-2 rounded-lg ${estilosTendencia.bg}`}>
              <ShoppingCart className={`w-5 h-5 ${estilosTendencia.color}`} />
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Por día</p>
              <p className="text-lg font-bold">{compras_por_dia.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Por semana</p>
              <p className="text-lg font-bold">{compras_por_semana.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total mes</p>
              <p className="text-lg font-bold">{compras_por_mes}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
