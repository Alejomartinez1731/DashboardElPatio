/**
 * KPI de Velocidad de Gasto
 * Muestra el gasto diario promedio × días restantes del mes
 */

import { Zap, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatearMoneda } from '@/lib/formatters';

interface VelocidadGastoKPIProps {
  gasto_diario_promedio: number;
  dias_restantes_mes: number;
  proyeccion_mensual: number;
  alerta_exceso: boolean;
  className?: string;
}

export function VelocidadGastoKPI({
  gasto_diario_promedio,
  dias_restantes_mes,
  proyeccion_mensual,
  alerta_exceso,
  className = '',
}: VelocidadGastoKPIProps) {
  const estilos = alerta_exceso
    ? { color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-950/30' }
    : { color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-950/30' };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Velocidad de Gasto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Gasto diario promedio</p>
              <p className={`text-xl font-bold ${estilos.color}`}>
                {formatearMoneda(gasto_diario_promedio)}
                <span className="text-sm text-muted-foreground font-normal">/día</span>
              </p>
            </div>
            <div className={`p-2 rounded-lg ${estilos.bg}`}>
              <Zap className={`w-5 h-5 ${estilos.color}`} />
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Proyección mensual</span>
              <span className={alerta_exceso ? 'text-orange-500 font-semibold' : ''}>
                {formatearMoneda(proyeccion_mensual)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Días restantes</span>
              <span>{dias_restantes_mes} días</span>
            </div>
          </div>

          {alerta_exceso && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg text-orange-500 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Proyección supera el gasto actual en >20%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
