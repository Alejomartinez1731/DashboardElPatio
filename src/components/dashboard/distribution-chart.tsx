'use client';

import { Card } from '@/components/ui/card';
import { Compra, DistribucionTienda } from '@/types';
import { formatearMoneda, formatearPorcentaje } from '@/lib/formatters';
import { normalizarTienda } from '@/lib/data-utils';
import { Cell, Pie, PieChart, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { COLORES_TIENDA } from '@/lib/data-utils';

interface DistributionChartProps {
  datos: Compra[];
  titulo?: string;
}

export function DistributionChart({ datos, titulo = 'Distribución por Tienda' }: DistributionChartProps) {
  // Calcular distribución por tienda
  const datosGrafico = useMemo(() => {
    const gastosPorTienda: Record<string, number> = {};

    datos.forEach(compra => {
      const tiendaNormalizada = normalizarTienda(compra.tienda);
      gastosPorTienda[tiendaNormalizada] = (gastosPorTienda[tiendaNormalizada] || 0) + compra.total;
    });

    const total = Object.values(gastosPorTienda).reduce((sum, val) => sum + val, 0);

    return Object.entries(gastosPorTienda).map(([tienda, monto]) => ({
      tienda,
      monto,
      porcentaje: total > 0 ? (monto / total) * 100 : 0,
      color: COLORES_TIENDA[tienda] || COLORES_TIENDA['Otros'],
    })).sort((a, b) => b.monto - a.monto); // Ordenar por monto descendente
  }, [datos]);

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-white mb-4">{titulo}</h3>

      {datosGrafico.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Sin datos para mostrar
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={datosGrafico}
                dataKey="monto"
                nameKey="tienda"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={0}
              >
                {datosGrafico.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                }}
                formatter={(valor: any, name: any) => {
                  return [
                    formatearMoneda(Number(valor) || 0),
                    name,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Leyenda */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {datosGrafico.map((entry) => (
              <div key={entry.tienda} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-muted-foreground">{entry.tienda}</span>
                <span className="text-muted-foreground ml-auto">
                  {formatearPorcentaje(entry.porcentaje)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
