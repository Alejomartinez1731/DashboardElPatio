'use client';

import { Card } from '@/components/ui/card';
import { Compra } from '@/types';
import { formatearMoneda, obtenerDiaSemana } from '@/lib/formatters';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

interface TrendChartProps {
  datos: Compra[];
  titulo?: string;
  dias?: number; // Últimos N días
}

export function TrendChart({ datos, titulo = 'Tendencia de Gastos', dias = 30 }: TrendChartProps) {
  // Agrupar gastos por fecha
  const datosGrafico = useMemo(() => {
    const gastosPorFecha: Record<string, number> = {};

    // Filtrar últimos N días
    const ahora = new Date();
    const fechaLimite = new Date(ahora);
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    datos.forEach(compra => {
      if (compra.fecha >= fechaLimite) {
        const fechaStr = compra.fecha.toISOString().split('T')[0];
        gastosPorFecha[fechaStr] = (gastosPorFecha[fechaStr] || 0) + compra.total;
      }
    });

    // Crear array ordenado por fecha
    return Object.entries(gastosPorFecha)
      .map(([fecha, monto]) => ({
        fecha: new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        monto,
      }))
      .sort((a, b) => {
        const [diaA, mesA] = a.fecha.split('/');
        const [diaB, mesB] = b.fecha.split('/');
        return new Date(2024, parseInt(mesA) - 1, parseInt(diaA)).getTime() -
               new Date(2024, parseInt(mesB) - 1, parseInt(diaB)).getTime();
      });
  }, [datos, dias]);

  const maxMonto = Math.max(...datosGrafico.map(d => d.monto), 1);
  const promedio = datosGrafico.reduce((sum, d) => sum + d.monto, 0) / datosGrafico.length;

  return (
    <Card className="p-6 bg-[#111827] border-[#1e293b]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{titulo}</h3>
          <p className="text-xs text-[#64748b] mt-1">Últimos {dias} días</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#64748b]">Promedio diario</p>
          <p className="text-lg font-bold text-[#f59e0b] font-mono">{formatearMoneda(promedio)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={datosGrafico} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
            opacity={0.5}
          />
          <XAxis
            dataKey="fecha"
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="none"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            stroke="none"
            tickFormatter={(valor) => valor >= 1000 ? `${(valor/1000).toFixed(0)}k` : valor}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
            }}
            formatter={(valor: any) => [formatearMoneda(Number(valor) || 0), 'Gasto']}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Area
            type="monotone"
            dataKey="monto"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#colorGasto)"
            animationBegin={0}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
