'use client';

import { Card } from '@/components/ui/card';
import { CategoriaProducto, CATEGORIAS_INFO } from '@/types';
import { calcularGastoPorCategoria, calcularPorcentajePorCategoria } from '@/lib/categorias';
import { formatearMoneda } from '@/lib/formatters';
import { Compra } from '@/types';

interface CategoryKPIsProps {
  compras: Compra[];
}

export function CategoryKPIs({ compras }: CategoryKPIsProps) {
  const gastoPorCategoria = calcularGastoPorCategoria(compras);
  const porcentajePorCategoria = calcularPorcentajePorCategoria(compras);

  // Ordenar categorías por gasto descendente
  const categoriasOrdenadas = (Object.keys(gastoPorCategoria) as CategoriaProducto[])
    .filter(cat => gastoPorCategoria[cat] > 0)
    .sort((a, b) => gastoPorCategoria[b] - gastoPorCategoria[a]);

  if (categoriasOrdenadas.length === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
        <p className="text-center text-muted-foreground text-sm">No hay datos de categorías</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-card border-border">
      <h3 className="text-sm font-semibold text-white mb-4">Gasto por Categoría</h3>

      <div className="space-y-3">
        {categoriasOrdenadas.map((categoria) => {
          const info = CATEGORIAS_INFO[categoria];
          const gasto = gastoPorCategoria[categoria];
          const porcentaje = porcentajePorCategoria[categoria];

          return (
            <div key={categoria} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icono}</span>
                  <span className="text-white font-medium">{info.nombre}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-semibold font-mono">
                    {formatearMoneda(gasto)}
                  </span>
                  <span className="text-muted-foreground text-xs ml-2">
                    ({porcentaje.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(porcentaje, 100)}%`,
                    backgroundColor: info.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
