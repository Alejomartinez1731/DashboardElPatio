/**
 * KPI de Margen de Ahorro
 * Muestra (Presupuesto - Gasto) / Presupuesto × 100
 */

import { Wallet, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatearMoneda } from '@/lib/formatters';

interface MargenAhorroKPIProps {
  presupuesto: number;
  gastado: number;
  margen_eur: number;
  margen_porcentaje: number;
  estado: 'positivo' | 'negativo' | 'neutral';
  className?: string;
}

export function MargenAhorroKPI({
  presupuesto,
  gastado,
  margen_eur,
  margen_porcentaje,
  estado,
  className = '',
}: MargenAhorroKPIProps) {
  const getEstilos = () => {
    switch (estado) {
      case 'positivo':
        return {
          icono: TrendingUp,
          color: 'text-green-500',
          bg: 'bg-green-50 dark:bg-green-950/30',
          iconBg: 'bg-green-100 dark:bg-green-950/30',
        };
      case 'negativo':
        return {
          icono: TrendingDown,
          color: 'text-red-500',
          bg: 'bg-red-50 dark:bg-red-950/30',
          iconBg: 'bg-red-100 dark:bg-red-950/30',
        };
      default:
        return {
          icono: Minus,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50 dark:bg-yellow-950/30',
          iconBg: 'bg-yellow-100 dark:bg-yellow-950/30',
        };
    }
  };

  const estilos = getEstilos();
  const Icono = estilos.icono;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Margen de Ahorro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${estilos.color}`}>
                {margen_porcentaje.toFixed(1)}%
              </span>
              <span className={`text-sm ${estilos.color}`}>
                ({margen_eur >= 0 ? '+' : '-'}{formatearMoneda(Math.abs(margen_eur))})
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Presupuesto: {formatearMoneda(presupuesto)}</span>
              <span>Gastado: {formatearMoneda(gastado)}</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${estilos.iconBg}`}>
            <Icono className={`w-6 h-6 ${estilos.color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
