'use client';

import { Card } from '@/components/ui/card';
import { Compra } from '@/types';
import { formatearMoneda, formatearFecha } from '@/lib/formatters';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface QuincenaData {
  periodo: string;
  gasto: number;
  compras: number;
}

interface QuincenaChartProps {
  datos: Compra[];
  titulo?: string;
  numQuincenas?: number;
}

/**
 * Obtiene el número de quincena para una fecha
 * Quincena 1: días 1-15
 * Quincena 2: días 16 hasta el último día del mes
 */
function getQuincena(fecha: Date): number {
  const dia = fecha.getDate();
  return dia <= 15 ? 1 : 2;
}

/**
 * Obtiene el identificador de quincena en formato YYYY-MM-Q
 */
function getQuincenaKey(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const quincena = getQuincena(fecha);
  return `${anio}-${String(mes).padStart(2, '0')}-Q${quincena}`;
}

/**
 * Formatea el identificador de quincena para mostrar
 */
function formatQuincenaLabel(key: string): string {
  const [anio, mes, quincena] = key.split('-');
  const mesNombre = new Date(parseInt(anio), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'short' });
  return `${mesNombre} ${quincena === 'Q1' ? '1ª' : '2ª'}`;
}

export function QuincenaChart({ datos, titulo = 'Evolución Quincenal', numQuincenas = 6 }: QuincenaChartProps) {
  // Agrupar gastos por quincena
  const datosGrafico = useMemo(() => {
    const gastosPorQuincena: Record<string, { gasto: number; compras: number; fecha: Date }> = {};

    datos.forEach(compra => {
      const fecha = new Date(compra.fecha);
      const key = getQuincenaKey(fecha);

      if (!gastosPorQuincena[key]) {
        gastosPorQuincena[key] = { gasto: 0, compras: 0, fecha };
      }

      gastosPorQuincena[key].gasto += compra.total;
      gastosPorQuincena[key].compras += 1;
    });

    // Convertir a array y ordenar cronológicamente
    const quincenas = Object.entries(gastosPorQuincena)
      .map(([key, value]) => ({
        periodo: formatQuincenaLabel(key),
        gasto: Math.round(value.gasto * 100) / 100, // Redondear a 2 decimales
        compras: value.compras,
      }))
      .sort((a, b) => {
        // Ordenar por fecha (asumimos que las claves están en formato YYYY-MM-Q)
        const quincenas = Object.keys(gastosPorQuincena).sort();
        const indexA = quincenas.findIndex(k => formatQuincenaLabel(k) === a.periodo);
        const indexB = quincenas.findIndex(k => formatQuincenaLabel(k) === b.periodo);
        return indexA - indexB;
      });

    // Retornar las últimas N quincenas
    return quincenas.slice(-numQuincenas);
  }, [datos, numQuincenas]);

  const maxGasto = Math.max(...datosGrafico.map(d => d.gasto), 1);
  const minGasto = Math.min(...datosGrafico.map(d => d.gasto));

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">{titulo}</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          Últimas {datosGrafico.length} quincenas
        </div>
      </div>

      {datosGrafico.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-muted-foreground">
          No hay datos suficientes
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="periodo"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              stroke="none"
            />
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              stroke="none"
              tickFormatter={(valor) => formatearMoneda(valor)}
              domain={[0, maxGasto * 1.1]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#F8FAFC',
              }}
              formatter={(valor: any, name: string) => {
                if (name === 'gasto') return [formatearMoneda(Number(valor) || 0), 'Gasto'];
                if (name === 'compras') return [valor, 'Compras'];
                return [valor, name];
              }}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Line
              type="monotone"
              dataKey="gasto"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Resumen */}
      {datosGrafico.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tendencia</span>
            <span className={`font-semibold ${
              datosGrafico[datosGrafico.length - 1].gasto > datosGrafico[datosGrafico.length - 2].gasto
                ? 'text-red-500'
                : datosGrafico[datosGrafico.length - 1].gasto < datosGrafico[datosGrafico.length - 2].gasto
                ? 'text-green-500'
                : 'text-gray-400'
            }`}>
              {datosGrafico[datosGrafico.length - 1].gasto > datosGrafico[datosGrafico.length - 2].gasto ? (
                <>↑ {formatearMoneda(datosGrafico[datosGrafico.length - 1].gasto - datosGrafico[datosGrafico.length - 2].gasto)}</>
              ) : datosGrafico[datosGrafico.length - 1].gasto < datosGrafico[datosGrafico.length - 2].gasto ? (
                <>↓ {formatearMoneda(datosGrafico[datosGrafico.length - 2].gasto - datosGrafico[datosGrafico.length - 1].gasto)}</>
              ) : (
                '= Sin cambios'
              )}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
