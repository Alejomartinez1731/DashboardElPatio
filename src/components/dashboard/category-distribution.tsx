'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { CategoriaProducto, CATEGORIAS_INFO } from '@/types';
import { calcularGastoPorCategoria, calcularPorcentajePorCategoria } from '@/lib/categorias';
import { formatearMoneda } from '@/lib/formatters';
import { Compra } from '@/types';

interface CategoryDistributionProps {
  compras: Compra[];
}

export function CategoryDistribution({ compras }: CategoryDistributionProps) {
  const gastoPorCategoria = calcularGastoPorCategoria(compras);
  const porcentajePorCategoria = calcularPorcentajePorCategoria(compras);

  // Preparar datos para el gráfico
  const datosGrafico = Object.entries(gastoPorCategoria)
    .filter(([_, gasto]) => gasto > 0)
    .map(([categoria, gasto]) => ({
      name: CATEGORIAS_INFO[categoria as CategoriaProducto].nombre,
      value: gasto,
      porcentaje: porcentajePorCategoria[categoria as CategoriaProducto],
      color: CATEGORIAS_INFO[categoria as CategoriaProducto].color,
      icono: CATEGORIAS_INFO[categoria as CategoriaProducto].icono,
    }))
    .sort((a, b) => b.value - a.value); // Ordenar por gasto descendente

  if (datosGrafico.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
        <p className="text-center text-muted-foreground text-sm">No hay datos de categorías</p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-white">{data.icono} {data.name}</p>
          <p className="text-xs text-muted-foreground">
            Gasto: {formatearMoneda(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">
            ({data.porcentaje.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // No mostrar etiqueta si es menos del 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
      <h3 className="text-sm font-semibold text-white mb-4">Distribución por Categoría</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datosGrafico}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {datosGrafico.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda personalizada */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {datosGrafico.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.icono}</span>
            <span className="text-white">{item.name}</span>
            <span className="text-muted-foreground ml-auto">
              {item.porcentaje.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
