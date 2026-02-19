'use client';

import { Card } from '@/components/ui/card';
import { Compra } from '@/types';
import { formatearMoneda } from '@/lib/formatters';
import { Trophy, TrendingUp, Minus } from 'lucide-react';
import { useMemo } from 'react';
import { normalizarTienda, COLORES_TIENDA } from '@/lib/data-utils';

interface TopProductsEnhancedProps {
  compras: Compra[];
  titulo?: string;
  limite?: number;
}

export function TopProductsEnhanced({
  compras,
  titulo = 'Productos Más Comprados',
  limite = 8
}: TopProductsEnhancedProps) {
  // Agrupar por producto
  const topProductos = useMemo(() => {
    const productos: Record<string, { total: number; cantidad: number; tiendas: Set<string> }> = {};

    compras.forEach(compra => {
      const key = compra.producto.toLowerCase().trim();
      if (!productos[key]) {
        productos[key] = { total: 0, cantidad: 0, tiendas: new Set() };
      }
      productos[key].total += compra.total;
      productos[key].cantidad += compra.cantidad;
      productos[key].tiendas.add(normalizarTienda(compra.tienda));
    });

    return Object.entries(productos)
      .map(([producto, data]) => ({
        producto,
        total: data.total,
        cantidad: data.cantidad,
        precioMedio: data.total / data.cantidad,
        tiendas: Array.from(data.tiendas),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limite);
  }, [compras, limite]);

  if (topProductos.length === 0) {
    return (
      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-white mb-4">{titulo}</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Sin datos de productos
        </div>
      </Card>
    );
  }

  const maxTotal = topProductos[0].total;

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[#f59e0b]" />
          <h3 className="text-lg font-semibold text-white">{titulo}</h3>
        </div>
        <span className="text-xs text-muted-foreground">Top {limite} productos</span>
      </div>

      <div className="space-y-3">
        {topProductos.map((item, index) => {
          const porcentaje = (item.total / maxTotal) * 100;
          const esTop3 = index < 3;

          return (
            <div
              key={item.producto}
              className="group flex items-center gap-3 p-3 bg-muted hover:bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-all duration-200"
            >
              {/* Ranking */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                index === 0
                  ? 'bg-gradient-to-br from-[#f59e0b] to-[#fbbf24] text-white'
                  : index === 1
                  ? 'bg-gradient-to-br from-[#94a3b8] to-[#cbd5e1] text-white'
                  : index === 2
                  ? 'bg-gradient-to-br from-[#b45309] to-[#d97706] text-white'
                  : 'bg-[#1e293b] text-muted-foreground'
              }`}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium text-white truncate pr-2" title={item.producto}>
                    {item.producto}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{item.cantidad}u</span>
                    <span className="text-sm font-bold text-white font-mono">{formatearMoneda(item.total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        esTop3
                          ? 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]'
                          : 'bg-[#64748b]'
                      }`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{porcentaje.toFixed(0)}%</span>
                </div>

                {/* Tiendas */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {item.tiendas.slice(0, 3).map((tienda) => (
                    <div
                      key={tienda}
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORES_TIENDA[tienda] || COLORES_TIENDA['Otros'] }}
                      title={tienda}
                    />
                  ))}
                  {item.tiendas.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{item.tiendas.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
