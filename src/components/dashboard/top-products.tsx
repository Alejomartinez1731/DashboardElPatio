'use client';

import { Card } from '@/components/ui/card';
import { Compra, ProductoCostoso } from '@/types';
import { formatearMoneda } from '@/lib/formatters';
import { COLORES_TIENDA } from '@/lib/data-utils';
import { useMemo } from 'react';
import { Trophy } from 'lucide-react';

interface TopProductsProps {
  compras: Compra[];
  limite?: number;
  titulo?: string;
}

export function TopProducts({ compras, limite = 8, titulo = 'Top Productos Costosos' }: TopProductsProps) {
  // Calcular los productos más costosos
  const productosTop = useMemo(() => {
    // Agrupar por producto
    const productos: Record<string, Compra[]> = {};

    compras.forEach(compra => {
      if (!productos[compra.producto]) {
        productos[compra.producto] = [];
      }
      productos[compra.producto].push(compra);
    });

    // Encontrar el precio máximo de cada producto
    const productosMaximos: ProductoCostoso[] = Object.entries(productos).map(
      ([producto, comprasProd]) => {
        const precioMax = Math.max(...comprasProd.map(c => c.precioUnitario));
        return {
          descripcion: producto,
          precioMaximo: precioMax,
        };
      }
    );

    // Ordenar por precio descendente y tomar los top N
    return productosMaximos
      .sort((a, b) => b.precioMaximo - a.precioMaximo)
      .slice(0, limite)
      .map((p, index) => ({ ...p, posicion: index + 1 }));
  }, [compras, limite]);

  const getMedalla = (posicion: number) => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return `${posicion}.`;
  };

  return (
    <Card className="p-6 bg-[#111827] border-[#1e293b]">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-[#f59e0b]" />
        <h3 className="text-lg font-semibold text-white">{titulo}</h3>
      </div>

      {productosTop.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-[#64748b]">
          Sin datos para mostrar
        </div>
      ) : (
        <div className="space-y-2">
          {productosTop.map((producto, index) => (
            <div
              key={producto.descripcion}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                producto.posicion === 1
                  ? 'bg-[#f59e0b]/10 border border-[#f59e0b]/30'
                  : 'bg-[#1a2234] border border-[#1e293b] hover:border-[#f59e0b]/30'
              }`}
            >
              <div className="text-lg font-bold w-8 text-center">
                {getMedalla(producto.posicion)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {producto.descripcion}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[#f59e0b] font-semibold font-mono">
                  {formatearMoneda(producto.precioMaximo)}
                </p>
                <p className="text-xs text-[#64748b]">p. unidad</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
