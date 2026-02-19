'use client';

import { Card } from '@/components/ui/card';
import { Compra, GastoSemanal } from '@/types';
import { obtenerDiaSemana, formatearMoneda } from '@/lib/formatters';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface WeeklyChartProps {
  datos: Compra[];
  titulo?: string;
}

export function WeeklyChart({ datos, titulo = 'Gasto Semanal' }: WeeklyChartProps) {
  // Agrupar gastos por día de la semana (Lun-Dom)
  const datosGrafico = useMemo(() => {
    const gastosPorDia: Record<number, number> = {};

    datos.forEach(compra => {
      const diaSemana = compra.fecha.getDay();
      gastosPorDia[diaSemana] = (gastosPorDia[diaSemana] || 0) + compra.total;
    });

    // Crear array de Lun(1) a Dom(0)
    const dias: GastoSemanal[] = [];
    for (let i = 1; i <= 6; i++) {
      dias.push({
        dia: obtenerDiaSemana(new Date(2025, 0, i + 6)), // Cualquier fecha de ese día
        monto: gastosPorDia[i] || 0,
      });
    }
    dias.push({
      dia: obtenerDiaSemana(new Date(2025, 0, 5)), // Domingo
      monto: gastosPorDia[0] || 0,
    });

    return dias;
  }, [datos]);

  const maxMonto = Math.max(...datosGrafico.map(d => d.monto), 1);

  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold text-white mb-4">{titulo}</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
          />
          <XAxis
            dataKey="dia"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            stroke="none"
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            stroke="none"
            tickFormatter={(valor) => formatearMoneda(valor)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(valor: any) => formatearMoneda(Number(valor) || 0)}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar
            dataKey="monto"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
