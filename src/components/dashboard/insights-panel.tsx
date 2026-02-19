'use client';

import { Card } from '@/components/ui/card';
import { Compra } from '@/types';
import { formatearMoneda } from '@/lib/formatters';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';

interface InsightsPanelProps {
  compras: Compra[];
}

interface Insight {
  tipo: 'info' | 'warning' | 'success';
  icon: React.ElementType;
  titulo: string;
  descripcion: string;
}

export function InsightsPanel({ compras }: InsightsPanelProps) {
  const insights = useMemo(() => {
    const nuevosInsights: Insight[] = [];

    if (compras.length === 0) {
      return nuevosInsights;
    }

    // Calcular estadísticas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const gastosHoy = compras
      .filter(c => {
        const fecha = new Date(c.fecha);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === hoy.getTime();
      })
      .reduce((sum, c) => sum + c.total, 0);

    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const gastosAyer = compras
      .filter(c => {
        const fecha = new Date(c.fecha);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === ayer.getTime();
      })
      .reduce((sum, c) => sum + c.total, 0);

    // Insight 1: Comparativa con ayer
    if (gastosHoy > 0 && gastosAyer > 0) {
      const variacion = ((gastosHoy - gastosAyer) / gastosAyer) * 100;

      if (variacion > 20) {
        nuevosInsights.push({
          tipo: 'warning',
          icon: TrendingUp,
          titulo: 'Gasto elevado hoy',
          descripcion: `Has gastado un ${variacion.toFixed(0)}% más que ayer (${formatearMoneda(gastosHoy)})`,
        });
      } else if (variacion < -20) {
        nuevosInsights.push({
          tipo: 'success',
          icon: TrendingDown,
          titulo: '¡Buen control de gastos!',
          descripcion: `Has gastado un ${Math.abs(variacion).toFixed(0)}% menos que ayer`,
        });
      }
    }

    // Insight 2: Tienda más frecuente
    const tiendas: Record<string, number> = {};
    compras.forEach(c => {
      tiendas[c.tienda] = (tiendas[c.tienda] || 0) + 1;
    });

    const tiendaTop = Object.entries(tiendas).sort((a, b) => b[1] - a[1])[0];
    if (tiendaTop) {
      const porcentaje = (tiendaTop[1] / compras.length) * 100;
      if (porcentaje > 40) {
        nuevosInsights.push({
          tipo: 'info',
          icon: Lightbulb,
          titulo: 'Tienda favorita',
          descripcion: `${tiendaTop[0]} concentra el ${porcentaje.toFixed(0)}% de tus compras`,
        });
      }
    }

    // Insight 3: Compra más costosa reciente
    const comprasRecientes = compras
      .filter(c => {
        const fecha = new Date(c.fecha);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === hoy.getTime();
      })
      .sort((a, b) => b.total - a.total);

    if (comprasRecientes.length > 0 && comprasRecientes[0].total > 100) {
      nuevosInsights.push({
        tipo: 'info',
        icon: AlertTriangle,
        titulo: 'Compra destacada',
        descripcion: `${comprasRecientes[0].producto} - ${formatearMoneda(comprasRecientes[0].total)}`,
      });
    }

    return nuevosInsights;
  }, [compras]);

  const estilosIcono = {
    info: 'bg-chart-2/10 text-chart-2',
    warning: 'bg-primary/10 text-primary',
    success: 'bg-chart-1/10 text-chart-1',
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-white">Insights del Día</h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-muted hover:bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all duration-200"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${estilosIcono[insight.tipo]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1">{insight.titulo}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.descripcion}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
