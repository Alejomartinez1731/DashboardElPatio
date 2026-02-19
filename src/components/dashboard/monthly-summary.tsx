'use client';

import { Card } from '@/components/ui/card';
import { Compra } from '@/types';
import { formatearMoneda, obtenerNombreMes } from '@/lib/formatters';
import { TrendingUp, Calendar, ShoppingCart } from 'lucide-react';
import { useMemo } from 'react';

interface MonthlySummaryProps {
  datos: Compra[];
  titulo?: string;
}

export function MonthlySummary({ datos, titulo = 'Resumen Mensual' }: MonthlySummaryProps) {
  // Agrupar gastos por mes
  const resumenMensual = useMemo(() => {
    const gastosPorMes: Record<string, { total: number; count: number }> = {};

    datos.forEach(compra => {
      const mesKey = `${compra.fecha.getFullYear()}-${compra.fecha.getMonth()}`;
      if (!gastosPorMes[mesKey]) {
        gastosPorMes[mesKey] = { total: 0, count: 0 };
      }
      gastosPorMes[mesKey].total += compra.total;
      gastosPorMes[mesKey].count += 1;
    });

    return Object.entries(gastosPorMes)
      .map(([key, data]) => {
        const [anio, mes] = key.split('-').map(Number);
        return {
          fecha: new Date(anio, mes, 1),
          mes: obtenerNombreMes(new Date(anio, mes, 1)),
          anio,
          total: data.total,
          count: data.count,
        };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
      .slice(0, 6); // Últimos 6 meses
  }, [datos]);

  const totalGeneral = resumenMensual.reduce((sum, m) => sum + m.total, 0);
  const promedioMensual = totalGeneral / resumenMensual.length || 0;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">6 meses</span>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg border border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Total del periodo</p>
          <p className="text-xl font-bold text-white font-mono">{formatearMoneda(totalGeneral)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Promedio mensual</p>
          <p className="text-xl font-bold text-[#10b981] font-mono">{formatearMoneda(promedioMensual)}</p>
        </div>
      </div>

      {/* Lista de meses */}
      <div className="space-y-3">
        {resumenMensual.map((mes, index) => {
          const porcentaje = (mes.total / totalGeneral) * 100;
          const esMaximo = index === 0;

          return (
            <div
              key={`${mes.anio}-${mes.mes}`}
              className="group flex items-center gap-4 p-3 bg-muted hover:bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  esMaximo ? 'bg-primary/20' : 'bg-card'
                }`}>
                  <ShoppingCart className={`w-5 h-5 ${esMaximo ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white capitalize">{mes.mes}</span>
                    <span className="text-xs text-muted-foreground">{mes.anio}</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">{formatearMoneda(mes.total)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        esMaximo ? 'bg-gradient-to-r from-primary to-amber-400' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{porcentaje.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
